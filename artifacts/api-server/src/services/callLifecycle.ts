import { prisma } from "@workspace/db-prisma";
import { scheduleExtraction } from "./taskExtraction";
import { analyzeCallForEscalation } from "./callAnalysis";
import { askUserDuringCall, rejectLiveQueries } from "./liveEscalation";
import { logger } from "../lib/logger";
import { computeNextAttempt } from "./schedulerPolicy";
import { getOrCreateRelationship, ingestMessage, scheduleConsolidation } from "./memory";

interface EndCallArgs {
  outcome: "booked" | "rescheduled" | "cancelled" | "info_gathered" | "needs_user" | "failed";
  summary: string;
  confirmedAt?: string;
  confirmationRef?: string;
}

/**
 * Applies a call outcome to the associated task.
 * Updates the task's scheduler status based on the outcome.
 *
 * - booked, rescheduled, cancelled, info_gathered: task is completed
 * - needs_user: task remains open, scheduler status is done (waiting on user)
 * - failed or no outcome: task is rescheduled with backoff
 *
 * Runs after post-call analysis so call.outcome reflects the analysis when the
 * agent didn't report one.
 *
 * If the call came from the scheduler (has schedulerClaimedAt), we do NOT increment
 * callAttempts here - the scheduler counts its own attempts. Only manual calls increment.
 */
export async function applyCallOutcomeToTask(callId: string): Promise<void> {
  const call = await prisma.call.findUnique({
    where: { id: callId },
    select: { taskId: true, outcome: true, schedulerClaimedAt: true },
  });

  if (!call || !call.taskId) {
    return;
  }

  const now = new Date();
  const outcome = call.outcome;
  const fromScheduler = call.schedulerClaimedAt !== null;

  // Determine task update based on outcome
  if (outcome === "booked" || outcome === "rescheduled" || outcome === "cancelled" || outcome === "info_gathered") {
    // Task is completed
    await prisma.task.update({
      where: { id: call.taskId },
      data: {
        status: "done",
        completedAt: now,
        schedulerStatus: "done",
      },
    });
    logger.info({ callId, taskId: call.taskId, outcome }, "callLifecycle: task completed");
  } else if (outcome === "needs_user") {
    // Task remains open, waiting on user (answer flow will reopen it)
    await prisma.task.update({
      where: { id: call.taskId },
      data: {
        status: "waiting_user",
        schedulerStatus: "done",
      },
    });
    logger.info({ callId, taskId: call.taskId, outcome }, "callLifecycle: task waiting on user");
  } else {
    // failed or no outcome - reschedule with backoff
    const task = await prisma.task.findUnique({
      where: { id: call.taskId },
      select: { callAttempts: true },
    });

    // Only increment attempts for manual calls, not scheduler calls
    const newAttempts = fromScheduler ? (task?.callAttempts ?? 0) : (task?.callAttempts ?? 0) + 1;
    const nextAttemptAt = computeNextAttempt(newAttempts, now);

    // Check for exhaustion (MAX_ATTEMPTS from schedulerPolicy)
    const MAX_ATTEMPTS = 5;
    if (newAttempts >= MAX_ATTEMPTS) {
      await prisma.task.update({
        where: { id: call.taskId },
        data: {
          callAttempts: newAttempts,
          lastAttemptAt: now,
          schedulerStatus: "done",
          status: "cancelled",
        },
      });
      logger.info({ callId, taskId: call.taskId, outcome, attempts: newAttempts }, "callLifecycle: task exhausted");
    } else {
      await prisma.task.update({
        where: { id: call.taskId },
        data: {
          callAttempts: newAttempts,
          lastAttemptAt: now,
          schedulerStatus: "pending",
          nextAttemptAt,
        },
      });
      logger.info({ callId, taskId: call.taskId, outcome, nextAttemptAt, fromScheduler }, "callLifecycle: task rescheduled");
    }
  }
}

export function createCallLifecycle(opts: {
  callId: string;
  conversationId: string;
  ownerId: string;
  contactId: string;
  startedAt: Date;
  /** Owner has agent mode on: nobody is watching, so ask_user must not block the live call. */
  agentMode?: boolean;
  send: (msg: object) => void;
  closeSocket: () => void;
  getGemini: () => { close: () => void } | null;
  clearGemini: () => void;
}) {
  let audioEndsAt = Date.now();
  let ended = false;
  let turnLogQueue: Promise<void> = Promise.resolve();
  let relationshipId: string | null = null;
  let turnIndex = 0;

  async function logTurn(role: "user" | "assistant", content: string) {
    const currentConversationId = opts.conversationId;
    const currentCallId = opts.callId;

    // Get or create relationship on first turn
    if (!relationshipId) {
      try {
        const call = await prisma.call.findUnique({
          where: { id: currentCallId },
          select: { individualId: true, businessId: true, contactId: true },
        });
        if (call?.individualId && call?.businessId) {
          const relationship = await getOrCreateRelationship({
            individualId: call.individualId,
            businessId: call.businessId,
            contactId: call.contactId,
          });
          relationshipId = relationship.id;
        }
      } catch (err) {
        logger.error({ err, callId: currentCallId }, "callLifecycle: failed to get relationship");
      }
    }

    turnLogQueue = turnLogQueue
      .then(async () => {
        if (relationshipId) {
          // Phase 2: Use ingest service with seq and speaker
          await ingestMessage({
            relationshipId,
            callId: currentCallId,
            turnIndex,
            role,
            content,
            time: "Now",
            conversationId: currentConversationId,
          });
          turnIndex++;
        } else {
          // Fallback: old way without relationship
          await prisma.message.create({
            data: {
              role,
              content,
              time: "Now",
              conversationId: currentConversationId,
              callId: currentCallId,
            },
          });
        }
      })
      // Deliberately NO scheduleExtraction here: extracting mid-call acts on
      // half-finished conversations (tasks + Calendar events from a sentence
      // the contact is about to correct). end() schedules it once.
      .catch((err) => {
        logger.error({ err, role, currentConversationId }, "callLifecycle: failed to log turn");
      });
    await turnLogQueue;
  }

  function noteAudioOut(pcm24k: Int16Array) {
    audioEndsAt = Math.max(Date.now(), audioEndsAt) + (pcm24k.length / 24000) * 1000;
  }

  async function onEndCall(args: EndCallArgs) {
    opts.send({ type: "call_ended", reason: "agent" });
    const delay = Math.min(Math.max(audioEndsAt - Date.now() + 300, 300), 8000);
    await new Promise((resolve) => setTimeout(resolve, delay));
    await end("agent", args);
    opts.closeSocket();
  }

  async function end(by: "user" | "agent", args?: EndCallArgs) {
    if (ended) return;
    ended = true;

    const gemini = opts.getGemini();
    if (gemini) {
      gemini.close();
      opts.clearGemini();
    }

    const endedAt = new Date();
    await prisma.call.update({
      where: { id: opts.callId },
      data: {
        status: "completed",
        endedAt,
        durationSec: Math.round((endedAt.getTime() - opts.startedAt.getTime()) / 1000),
        disconnectedBy: by,
        outcome: args?.outcome,
        outcomeSummary: args?.summary,
        confirmedAt: args?.confirmedAt ? new Date(args.confirmedAt) : null,
        confirmationRef: args?.confirmationRef,
      },
    });

    await rejectLiveQueries(opts.callId);

    // Analyse FIRST: if the agent never called end_call, the analysis fills in
    // call.outcome, and the task must be updated from that — not treated as a
    // failed attempt and rescheduled.
    await analyzeCallForEscalation(opts.callId).catch((err) =>
      logger.error({ err, callId: opts.callId }, "callLifecycle: post-call analysis failed")
    );

    await applyCallOutcomeToTask(opts.callId).catch((err) =>
      logger.error({ err, callId: opts.callId }, "callLifecycle: failed to apply outcome to task")
    );

    // Phase 3: Schedule consolidation for post-call memory processing
    scheduleConsolidation(opts.callId);

    // Extract tasks/knowledge once, from the complete transcript, after the call.
    // (Extracting per turn would run mid-call on partial context.)
    scheduleExtraction(opts.conversationId);
  }

  async function onGeminiClosed() {
    await end("agent", { outcome: "failed", summary: "Voice session dropped" });
  }

  async function onAskUser(args: { question: string; knowledgeKey?: string; knowledgeCategory?: string }) {
    return askUserDuringCall({
      callId: opts.callId,
      conversationId: opts.conversationId,
      contactId: opts.contactId,
      ownerId: opts.ownerId,
      nonBlocking: opts.agentMode === true,
      ...args,
    });
  }

  return {
    logTurn,
    noteAudioOut,
    onEndCall,
    end,
    onGeminiClosed,
    onAskUser,
  };
}
