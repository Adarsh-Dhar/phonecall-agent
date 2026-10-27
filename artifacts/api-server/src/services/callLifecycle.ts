import { prisma } from "@workspace/db-prisma";
import { scheduleExtraction } from "./taskExtraction";
import { analyzeCallForEscalation } from "./callAnalysis";
import { askUserDuringCall, rejectLiveQueries } from "./liveEscalation";
import { normalizeEndCallArgs } from "./endCallArgs";
import { logger } from "../lib/logger";
import { computeNextAttempt, MAX_ATTEMPTS } from "./schedulerPolicy";
import { getOrCreateRelationship, ingestMessage, scheduleConsolidation } from "./memory";
import { broadcastCallExhausted } from "./notifications";
import { recordIntroOutcome } from "./introCall";
import { applyPostCallTasks } from "./postCallTasks";
import { createCallCalendarTools, isCalendarTool } from "./callCalendarTools";
import { createCallApproval, type ApprovalRuleLite } from "./approvalRules";
import { requestHandoff, handoffToolResponse, endLiveHandoff, closeCallHandoffs, type HandoffRequestInfo } from "./handoff";
import { scoreCall, extractLessonsFromCall } from "./callQuality";
import { notifyAgentCallDone } from "./ownerDigest";

export interface EndCallArgs {
  outcome: "booked" | "rescheduled" | "cancelled" | "info_gathered" | "needs_user" | "failed";
  summary: string;
  confirmedAt?: string;
  confirmationRef?: string;
  followUps?: Array<{ kind: "bring"|"pay"|"submit"|"follow_up"; title: string; dueAt?: string; details?: string }>;
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
 * If the call was placed by the agent (placedByAgent=true), we do NOT increment
 * callAttempts here - the scheduler counts its own attempts. Only manual calls increment.
 */
export async function applyCallOutcomeToTask(callId: string): Promise<void> {
  const call = await prisma.call.findUnique({
    where: { id: callId },
    select: { taskId: true, outcome: true, placedByAgent: true, individualId: true },
  });

  if (!call || !call.taskId) {
    return;
  }

  // Intro-call bookkeeping: a no-op for every other task.
  await recordIntroOutcome(call.taskId, call.outcome);

  const now = new Date();
  const outcome = call.outcome;
  const fromAgent = call.placedByAgent;

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
      select: { callAttempts: true, contactId: true },
    });

    // Only increment attempts for manual calls, not agent calls
    const newAttempts = fromAgent ? (task?.callAttempts ?? 0) : (task?.callAttempts ?? 0) + 1;
    const nextAttemptAt = computeNextAttempt(newAttempts, now);

    // Check for exhaustion
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
      await recordIntroOutcome(call.taskId, "final_failure");
      
      // Notify owner about exhaustion
      if (call.individualId && task?.contactId) {
        const taskDetails = await prisma.task.findUnique({
          where: { id: call.taskId },
          select: { title: true, contact: { select: { name: true } } },
        });
        broadcastCallExhausted({
          type: 'call_exhausted',
          ownerId: call.individualId,
          contactId: task.contactId,
          taskId: call.taskId,
          contactName: taskDetails?.contact.name || 'Unknown',
          title: taskDetails?.title || 'Unknown',
          attempts: newAttempts,
        }).catch((err) => {
          logger.error({ err, callId, taskId: call.taskId }, "callLifecycle: failed to broadcast call exhausted");
        });
      }
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
      logger.info({ callId, taskId: call.taskId, outcome, nextAttemptAt, fromAgent }, "callLifecycle: task rescheduled");
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
  /** Standing approval rules (agent mode). Loaded once when the call starts. */
  approvalRules?: ApprovalRuleLite[];
  ownerTz?: string;
  contactName?: string;
  /** Owner preference: ask before taking action. */
  confirmBeforeAction?: boolean;
  /** Owner preference: how long to wait for response (seconds). */
  ownerResponseTimeoutSec?: number;
  /** The room forwards a handoff request to owner sockets already inside the call. */
  onHandoffRequested?: (info: HandoffRequestInfo) => void;
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

  const approval = createCallApproval({
    callId: opts.callId,
    ownerId: opts.ownerId,
    agentMode: opts.agentMode === true,
    tz: opts.ownerTz ?? process.env.DEFAULT_TIMEZONE ?? "UTC",
    rules: opts.approvalRules ?? [],
    confirmBeforeAction: opts.confirmBeforeAction,
  });

  const calendarTools = createCallCalendarTools({
    callId: opts.callId,
    ownerId: opts.ownerId,
    contactId: opts.contactId,
    // Only gate in agent mode; with the owner on the line ask_user still decides.
    approval: opts.agentMode === true ? approval.slot : undefined,
  });

  // Seconds the owner spent live on this call; > 0 means a human did part of the work.
  let handoffLiveSec = 0;

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

  async function end(by: "user" | "agent", rawArgs?: EndCallArgs) {
    if (ended) return;
    ended = true;
    // Model output is untrusted: validate before anything touches the DB.
    const args = rawArgs ? normalizeEndCallArgs(rawArgs) : undefined;

    // Close any handoff first: it tells us whether the owner took part in this call.
    const liveSec = await endLiveHandoff(opts.callId).catch(() => null);
    if (liveSec) handoffLiveSec += liveSec;
    await closeCallHandoffs(opts.callId).catch(() => {});
    const ownerTookOver = handoffLiveSec > 0;

    // If the owner spoke to the business live and the agent never reported an outcome, the human
    // dealt with it: record that instead of letting the analysis call it a failed attempt. The
    // human part of the call is not transcribed, so there is nothing for the analysis to read.
    const outcome: string | undefined = args?.outcome ?? (ownerTookOver ? "info_gathered" : undefined);
    const outcomeSummary =
      args?.summary ?? (ownerTookOver ? `Owner took over the call live for ${handoffLiveSec}s. That part was not transcribed.` : undefined);

    const gemini = opts.getGemini();
    if (gemini) {
      gemini.close();
      opts.clearGemini();
    }

    const endedAt = new Date();
    const durationSec = Math.round((endedAt.getTime() - opts.startedAt.getTime()) / 1000);

    // Enforce maximum call duration
    const maxDurationMinutes = Number(process.env.MAX_CALL_DURATION_MINUTES) || 0;
    if (maxDurationMinutes > 0 && durationSec > maxDurationMinutes * 60) {
      logger.warn(
        { callId: opts.callId, durationSec, maxDurationMinutes },
        "callLifecycle: call exceeded maximum duration"
      );
    }

    try {
      await prisma.call.update({
        where: { id: opts.callId },
        data: {
          status: "completed",
          endedAt,
          durationSec,
          disconnectedBy: by,
          outcome,
          outcomeSummary,
          autonomous: opts.agentMode === true,
          confirmedAt: args?.confirmedAt ? new Date(args.confirmedAt) : null,
          confirmationRef: args?.confirmationRef,
        },
      });
    } catch (err) {
      // Never leave the row open: ended is already true, so nothing would retry.
      logger.error({ err, callId: opts.callId }, "callLifecycle: call update failed, closing minimally");
      await prisma.call.update({
        where: { id: opts.callId },
        data: { status: "completed", endedAt, durationSec, disconnectedBy: by, outcome: "failed" },
      }).catch((e) => logger.error({ err: e, callId: opts.callId }, "callLifecycle: minimal close failed"));
    }

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

    // The hold matching the confirmed time becomes the appointment's event; the rest are deleted.
    let adoptedEventId: string | undefined;
    try {
      const post = await applyPostCallTasks(opts.callId, args?.followUps, { holds: calendarTools.activeHolds() });
      adoptedEventId = post?.adoptedEventId;
    } catch (err) {
      logger.error({ err, callId: opts.callId }, "callLifecycle: post-call tasks failed");
    }
    await calendarTools.releaseHolds(adoptedEventId).catch((err) =>
      logger.error({ err, callId: opts.callId }, "callLifecycle: failed to release calendar holds")
    );

    // Phase 3: Schedule consolidation for post-call memory processing
    scheduleConsolidation(opts.callId);

    // Extract tasks/knowledge once, from the complete transcript, after the call.
    // (Extracting per turn would run mid-call on partial context.)
    scheduleExtraction(opts.conversationId);

    // Fire and forget: neither may delay hanging up or ever fail the call.
    void scoreCall(opts.callId)
      .then(() => extractLessonsFromCall(opts.callId))
      .catch((err) => logger.error({ err, callId: opts.callId }, "callLifecycle: quality scoring or lesson extraction failed"));
    if (opts.agentMode) {
      void notifyAgentCallDone(opts.callId).catch((err) => logger.error({ err, callId: opts.callId }, "callLifecycle: per-call notice failed"));
    }
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
      timeoutMs: opts.ownerResponseTimeoutSec ? opts.ownerResponseTimeoutSec * 1000 : undefined,
    });
  }

  /** check_availability / hold_slot / check_approval. Capped at 8 s so a slow Google call can't leave dead air. */
  async function onToolCall(name: string, args: unknown): Promise<unknown> {
    if (name === "check_approval") return approval.handle(args);
    if (!isCalendarTool(name)) return { error: "unknown tool" };
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<unknown>((resolve) => {
      timer = setTimeout(() => resolve({ error: "calendar_unavailable" }), 8000);
    });
    try {
      return await Promise.race([calendarTools.handle(name, args), timeout]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  /** request_human_handoff: waits for the owner (HANDOFF_TIMEOUT_MS), then tells the model what happened. */
  async function onHandoff(args: { reason: string; summary?: string }): Promise<Record<string, unknown>> {
    const result = await requestHandoff({
      callId: opts.callId,
      ownerId: opts.ownerId,
      contactName: opts.contactName ?? "",
      reason: args?.reason,
      summary: args?.summary,
      onRequested: opts.onHandoffRequested,
      timeoutMs: opts.ownerResponseTimeoutSec ? opts.ownerResponseTimeoutSec * 1000 : undefined,
    });
    return handoffToolResponse(result);
  }

  /** Owner handed back: record the time and tell the agent to pick the conversation up again. */
  function onHandoffEnded(seconds: number, resume: (text: string) => void) {
    handoffLiveSec += seconds;
    resume(
      "[SYSTEM] Your user has finished speaking with the other person and has left the call. You are back in charge. " +
        "Briefly check with the other person what was settled, then continue your task, or finish with end_call and an accurate outcome.",
    );
  }

  return {
    logTurn,
    noteAudioOut,
    onEndCall,
    end,
    onGeminiClosed,
    onAskUser,
    onToolCall,
    onHandoff,
    onHandoffEnded,
  };
}
