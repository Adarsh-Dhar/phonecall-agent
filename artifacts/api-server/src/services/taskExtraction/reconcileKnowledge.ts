import { KNOWLEDGE_CONFIDENCE_THRESHOLD, MAX_KNOWLEDGE_VALUE_CHARS } from "./config";
import type { KnowledgeAction, SkippedAction, TxClient } from "./types";

/**
 * Applies knowledge actions (upsert/invalidate) inside the caller's transaction.
 *
 * upsert
 *  - unusable value (empty / whitespace / too long)          -> skipped "invalid_value"
 *  - confidence >= threshold                                  -> "active" (used on calls)
 *  - below threshold                                          -> "suggested" (stored, not used)
 *  - below threshold on an already ACTIVE fact                -> skipped "would_overwrite_active_fact"
 * invalidate
 *  - unknown / already stale key                              -> skipped "unknown_fact"
 *  - an ACTIVE fact needs confidence >= threshold             -> else skipped "low_confidence"
 *  - a never-trusted "suggested" fact can be dropped at any confidence
 * Only source messages from the current batch are linked.
 */
export async function reconcileKnowledgeActions(
  tx: TxClient,
  params: {
    knowledgeActions: KnowledgeAction[];
    contactId: string;
    deltaMessages: Array<{ id: string }>;
  }
): Promise<{
  knowledgeUpserted: string[];
  knowledgeSuggested: string[];
  knowledgeInvalidated: string[];
  skipped: SkippedAction[];
}> {
  const { knowledgeActions, contactId, deltaMessages } = params;
  const deltaIds = new Set(deltaMessages.map((m) => m.id));

  const knowledgeUpserted: string[] = [];
  const knowledgeSuggested: string[] = [];
  const knowledgeInvalidated: string[] = [];
  const skipped: SkippedAction[] = [];
  const skip = (a: KnowledgeAction, reason: SkippedAction["reason"]) =>
    skipped.push({ kind: "knowledge", type: a.type, ref: a.key, reason });

  for (const action of knowledgeActions) {
    const sourceIds = (action.sourceMessageIds ?? []).filter((id) => deltaIds.has(id));
    const where = { contactId_key: { contactId, key: action.key } };
    const existing = await tx.contactKnowledge.findUnique({ where, select: { status: true } });
    const confident = action.confidence >= KNOWLEDGE_CONFIDENCE_THRESHOLD;

    if (action.type === "upsert") {
      const value = typeof action.value === "string" ? action.value.trim() : "";
      if (!value || value.length > MAX_KNOWLEDGE_VALUE_CHARS) { skip(action, "invalid_value"); continue; }
      if (!confident && existing?.status === "active") { skip(action, "would_overwrite_active_fact"); continue; }

      const status = confident ? "active" : "suggested";
      const fact = await tx.contactKnowledge.upsert({
        where,
        create: { contactId, category: action.category, key: action.key, value, confidence: action.confidence, status },
        update: { category: action.category, value, confidence: action.confidence, status },
      });
      (confident ? knowledgeUpserted : knowledgeSuggested).push(fact.id);

      for (const msgId of sourceIds) {
        await tx.knowledgeSourceMessage.upsert({
          where: { knowledgeId_messageId_role: { knowledgeId: fact.id, messageId: msgId, role: "updated" } },
          create: { knowledgeId: fact.id, messageId: msgId, role: "updated" },
          update: {},
        });
      }
    } else if (action.type === "invalidate") {
      if (!existing || existing.status === "stale") { skip(action, "unknown_fact"); continue; }
      if (existing.status === "active" && !confident) { skip(action, "low_confidence"); continue; }
      await tx.contactKnowledge.update({ where, data: { status: "stale" } });
      knowledgeInvalidated.push(action.key);
    }
  }

  return { knowledgeUpserted, knowledgeSuggested, knowledgeInvalidated, skipped };
}
