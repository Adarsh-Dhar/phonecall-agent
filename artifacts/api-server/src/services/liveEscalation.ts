import { prisma } from "@workspace/db-prisma";
import { sendToAccount } from "./notifications";
import { sendPushToAccount } from "./push";
import { slugify } from "../lib/utils";
import { logger } from "../lib/logger";

const pending = new Map<
  string,
  { resolve: (answer: string) => void; timer: NodeJS.Timeout; callId: string }
>();

export async function askUserDuringCall(opts: {
  callId: string;
  conversationId: string;
  contactId: string;
  ownerId: string;
  question: string;
  knowledgeKey?: string;
  knowledgeCategory?: string;
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
      knowledgeKey: opts.knowledgeKey ? slugify(opts.knowledgeKey) : slugify(opts.question),
      knowledgeCategory: opts.knowledgeCategory ?? "fact",
    },
  });

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

  return new Promise<string>((resolve) => {
    const timer = setTimeout(() => {
      pending.delete(q.id);
      resolve("USER_UNAVAILABLE");
    }, Number(process.env.ASK_USER_TIMEOUT_MS) || 45000);
    pending.set(q.id, { resolve, timer, callId: opts.callId });
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

export function rejectLiveQueries(callId: string): void {
  for (const [id, entry] of pending.entries()) {
    if (entry.callId === callId) {
      clearTimeout(entry.timer);
      pending.delete(id);
      entry.resolve("USER_UNAVAILABLE");
    }
  }
}
