import { prisma } from "@workspace/db-prisma";
import { sendToAccount } from "./presence";
import { sendPushToAccount } from "./push";
import { normalizeKnowledgeKey } from "../lib/utils";
import { logger } from "../lib/logger";
import { getOrCreateRelationship, createOpenLoopFromQuery } from "./memory";

const pending = new Map<
  string,
  { resolve: (answer: string) => void; timer: NodeJS.Timeout; callId: string; queryId: string }
>();

export async function askUserDuringCall(opts: {
  callId: string;
  conversationId: string;
  contactId: string;
  ownerId: string;
  question: string;
  knowledgeKey?: string;
  knowledgeCategory?: string;
  /**
   * Agent mode: the owner is not watching, so don't hold the live call waiting for an answer.
   * The question is still saved (with its open loop + push) for the owner to answer afterwards.
   */
  nonBlocking?: boolean;
  /** Timeout in milliseconds for waiting for user response. Defaults to 45s from env. */
  timeoutMs?: number;
}): Promise<string> {
  const q = await prisma.query.create({
    data: {
      question: opts.question,
      status: "pending",
      isKnowledgeGap: true,
      urgent: true,
      callId: opts.callId,
      conversationId: opts.conversationId,
      contactId: opts.contactId,
      knowledgeKey: normalizeKnowledgeKey(opts.knowledgeKey) || normalizeKnowledgeKey(opts.question),
      knowledgeCategory: opts.knowledgeCategory ?? "fact",
    },
  });

  // Phase 4: Create an OpenLoop for this query
  try {
    const call = await prisma.call.findUnique({
      where: { id: opts.callId },
      select: { individualId: true, businessId: true },
    });
    if (call?.individualId && call?.businessId) {
      const relationship = await getOrCreateRelationship({
        individualId: call.individualId,
        businessId: call.businessId,
        contactId: opts.contactId,
      });
      await createOpenLoopFromQuery({
        relationshipId: relationship.id,
        queryId: q.id,
        question: opts.question,
        sourceCallId: opts.callId,
      });
    }
  } catch (err) {
    logger.error({ err, callId: opts.callId }, "liveEscalation: failed to create open loop for query");
  }

  const payload = {
    type: "user_question",
    queryId: q.id,
    callId: opts.callId,
    question: opts.question,
    urgent: true,
  };

  if (!sendToAccount(opts.ownerId, payload)) {
    void sendPushToAccount(opts.ownerId, {
      title: "Your call agent needs you",
      body: opts.question,
      url: "/queries",
    });
  }

  if (opts.nonBlocking) {
    // Same sentinel as a timeout: the prompt already tells the agent to say it will call back
    // and end the call with outcome needs_user.
    return "USER_UNAVAILABLE";
  }

  return new Promise<string>((resolve) => {
    const timeoutMs = opts.timeoutMs ?? (Number(process.env.ASK_USER_TIMEOUT_MS) || 45000);
    const timer = setTimeout(async () => {
      pending.delete(q.id);
      // Resolve first so the agent doesn't hang if the DB call fails
      resolve("USER_UNAVAILABLE");
      // Mark query as expired when timeout happens (best-effort)
      try {
        await prisma.query.update({
          where: { id: q.id },
          data: { status: "expired" },
        });
        logger.info({ queryId: q.id, callId: opts.callId }, "liveEscalation: query expired due to timeout");
      } catch (err) {
        logger.error({ err, queryId: q.id, callId: opts.callId }, "liveEscalation: failed to mark query as expired");
      }
    }, timeoutMs);
    pending.set(q.id, { resolve, timer, callId: opts.callId, queryId: q.id });
  });
}

export function resolveLiveQuery(id: string, answer: string): boolean {
  const entry = pending.get(id);
  if (!entry) return false;
  clearTimeout(entry.timer);
  pending.delete(id);
  entry.resolve(answer);
  return true;
}

export async function rejectLiveQueries(callId: string): Promise<void> {
  for (const [id, entry] of pending.entries()) {
    if (entry.callId === callId) {
      clearTimeout(entry.timer);
      pending.delete(id);
      // Resolve first so the agent doesn't hang if the DB call fails
      entry.resolve("USER_UNAVAILABLE");
      // Mark query as expired when call ends (best-effort)
      try {
        await prisma.query.update({
          where: { id: entry.queryId },
          data: { status: "expired" },
        });
        logger.info({ queryId: entry.queryId, callId }, "liveEscalation: query expired due to call end");
      } catch (err) {
        logger.error({ err, queryId: entry.queryId, callId }, "liveEscalation: failed to mark query as expired");
      }
    }
  }
}
