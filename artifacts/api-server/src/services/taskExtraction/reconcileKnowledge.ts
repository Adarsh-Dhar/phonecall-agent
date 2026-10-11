import { KNOWLEDGE_CONFIDENCE_THRESHOLD } from "./config";
import type { KnowledgeAction, TxClient } from "./types";

/**
 * Applies knowledge actions (upsert/invalidate) inside the caller's transaction.
 *  - confidence >= KNOWLEDGE_CONFIDENCE_THRESHOLD → "active" (used in calls)
 *  - lower confidence → "suggested" (stored, not used), and it never overwrites
 *    a fact that is already active
 *  - invalidate needs a cited message and only touches keys that exist
 */
export async function reconcileKnowledgeActions(
  tx: TxClient,
  params: {
    knowledgeActions: KnowledgeAction[];
    contactId: string;
    deltaMessages: Array<{ id: string }>;
  }
): Promise<{ knowledgeUpserted: string[]; knowledgeInvalidated: string[] }> {
  const { knowledgeActions, contactId, deltaMessages } = params;
  const deltaIds = new Set(deltaMessages.map((m) => m.id));

  const knowledgeUpserted: string[] = [];
  const knowledgeInvalidated: string[] = [];

  for (const action of knowledgeActions) {
    const sourceIds = (action.sourceMessageIds ?? []).filter((id) => deltaIds.has(id));

    if (action.type === "upsert" && action.value) {
      const confident = action.confidence >= KNOWLEDGE_CONFIDENCE_THRESHOLD;
      const existing = await tx.contactKnowledge.findUnique({
        where: { contactId_key: { contactId, key: action.key } },
        select: { status: true },
      });
      if (!confident && existing?.status === "active") continue; // don't downgrade a known fact on a guess

      const status = confident ? "active" : "suggested";
      const fact = await tx.contactKnowledge.upsert({
        where: { contactId_key: { contactId, key: action.key } },
        create: {
          contactId, category: action.category, key: action.key,
          value: action.value, confidence: action.confidence, status,
        },
        update: { category: action.category, value: action.value, confidence: action.confidence, status },
      });
      knowledgeUpserted.push(fact.id);

      for (const msgId of sourceIds) {
        await tx.knowledgeSourceMessage.upsert({
          where: { knowledgeId_messageId_role: { knowledgeId: fact.id, messageId: msgId, role: "updated" } },
          create: { knowledgeId: fact.id, messageId: msgId, role: "updated" },
          update: {},
        });
      }
    } else if (action.type === "invalidate") {
      if (action.confidence < KNOWLEDGE_CONFIDENCE_THRESHOLD || sourceIds.length === 0) continue;
      const res = await tx.contactKnowledge.updateMany({
        where: { contactId, key: action.key, status: { in: ["active", "suggested"] } },
        data: { status: "stale" },
      });
      if (res.count > 0) knowledgeInvalidated.push(action.key);
    }
  }

  return { knowledgeUpserted, knowledgeInvalidated };
}
