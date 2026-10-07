import { prisma } from "@workspace/db-prisma";
import { scheduleExtraction } from "./taskExtraction";
import { analyzeCallForEscalation } from "./callAnalysis";
import { askUserDuringCall, rejectLiveQueries } from "./liveEscalation";
import { logger } from "../lib/logger";
import { computeNextAttempt } from "./schedulerPolicy";

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
 * Exported so it can be called from post-call analysis as well.
 */
export async function applyCallOutcomeToTask(callId: string): Promise<void> {
  const call = await prisma.call.findUnique({
    where: { id: callId },
    select: { taskId: true, outcome: true },
  });

  if (!call || !call.taskId) {
    return;
  }

  const now = new Date();
  const outcome = call.outcome;

  // Determine task update based on outcome
  if (outcome === "booked" || outcome === "rescheduled" || outcome === "cancelled" || outcome === "info_gathered") {
    // Task is completed
    await prisma.task.update({
      where: { id: call.taskId },
      data: {
        status: "completed",
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

    const newAttempts = (task?.callAttempts ?? 0) + 1;
    const nextAttemptAt = computeNextAttempt(newAttempts, now);

    await prisma.task.update({
      where: { id: call.taskId },
      data: {
        callAttempts: newAttempts,
        lastAttemptAt: now,
        schedulerStatus: "pending",
        nextAttemptAt,
      },
    });
    logger.info({ callId, taskId: call.taskId, outcome, nextAttemptAt }, "callLifecycle: task rescheduled");
  }
}

export function createCallLifecycle(opts: {
  callId: string;
  conversationId: string;
  ownerId: string;
  contactId: string;
  startedAt: Date;
  send: (msg: object) => void;
  closeSocket: () => void;
  getGemini: () => { close: () => void } | null;
  clearGemini: () => void;
}) {
  let audioEndsAt = Date.now();
  let ended = false;
  let turnLogQueue: Promise<void> = Promise.resolve();

  async function logTurn(role: "user" | "assistant", content: string) {
    const currentConversationId = opts.conversationId;
    const currentCallId = opts.callId;

    turnLogQueue = turnLogQueue
      .then(() =>
        prisma.message.create({
          data: {
            role,
            content,
            time: "Now",
            conversationId: currentConversationId,
            callId: currentCallId,
          },
        })
      )
      .then(() => {
        scheduleExtraction(currentConversationId);
      })
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

    // Apply call outcome to the associated task
    await applyCallOutcomeToTask(opts.callId).catch((err) =>
      logger.error({ err, callId: opts.callId }, "callLifecycle: failed to apply outcome to task")
    );

    await rejectLiveQueries(opts.callId);
    await analyzeCallForEscalation(opts.callId).catch((err) =>
      logger.error({ err, callId: opts.callId }, "callLifecycle: post-call analysis failed")
    );
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
