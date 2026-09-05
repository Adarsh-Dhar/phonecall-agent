import type { KnowledgeAction, TxClient } from "./types";

/**
 * Applies knowledge actions (upsert/invalidate) inside the caller's transaction.
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

  const knowledgeUpserted: string[] = [];
  const knowledgeInvalidated: string[] = [];

  for (const action of knowledgeActions) {
    const sourceIds: string[] = action.sourceMessageIds ?? [];

    if (action.type === "upsert" && action.value) {
      const fact = await tx.contactKnowledge.upsert({
        where: { contactId_key: { contactId, key: action.key } },
        create: {
          contactId,
          category: action.category,
          key: action.key,
          value: action.value,
          confidence: action.confidence,
        },
        update: {
          value: action.value,
          confidence: action.confidence,
          status: "active",
        },
      });
      knowledgeUpserted.push(fact.id);

      for (const msgId of sourceIds) {
        if (deltaMessages.find((m) => m.id === msgId)) {
          await tx.knowledgeSourceMessage.upsert({
            where: {
              knowledgeId_messageId_role: {
                knowledgeId: fact.id,
                messageId: msgId,
                role: "updated",
              },
            },
            create: { knowledgeId: fact.id, messageId: msgId, role: "updated" },
            update: {},
          });
        }
      }
    } else if (action.type === "invalidate") {
      await tx.contactKnowledge.updateMany({
        where: { contactId, key: action.key },
        data: { status: "stale" },
      });
      knowledgeInvalidated.push(action.key);
    }
  }

  return { knowledgeUpserted, knowledgeInvalidated };
}
