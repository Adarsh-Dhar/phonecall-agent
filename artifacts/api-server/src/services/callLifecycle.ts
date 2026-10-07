import { prisma } from "@workspace/db-prisma";
import { scheduleExtraction } from "./taskExtraction";
import { analyzeCallForEscalation } from "./callAnalysis";
import { askUserDuringCall, rejectLiveQueries } from "./liveEscalation";
import { logger } from "../lib/logger";

interface EndCallArgs {
  outcome: "booked" | "rescheduled" | "cancelled" | "info_gathered" | "needs_user" | "failed";
  summary: string;
  confirmedAt?: string;
  confirmationRef?: string;
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

    await rejectLiveQueries(opts.callId);
    await analyzeCallForEscalation(opts.callId).catch((err) =>
      logger.error({ err, callId: opts.callId }, "callLifecycle: post-call analysis failed")
    );
  }

  async function onGeminiClosed() {
    await end("agent", { outcome: "failed", summary: "Voice session dropped" });
  }

  async function onAskUser(args: { question: string; knowledgeKey?: string; knowledgeCategory?: string }) {
    await askUserDuringCall({
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
