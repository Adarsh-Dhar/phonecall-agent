import { KNOWLEDGE_CONFIDENCE_THRESHOLD, MAX_KNOWLEDGE_VALUE_CHARS } from "./config";
import type { KnowledgeAction, SkippedAction, TxClient } from "./types";

/**
 * Applies knowledge actions (upsert/invalidate) inside the caller's transaction.
 *
 * upsert
 *  - unusable value (empty / whitespace / too long)          -> skipped "invalid_value"
 *  - confidence >= threshold AND not from contact's own speech -> "active" (used on calls)
 *  - below threshold OR from contact's own speech                -> "suggested" (stored, not used)
 *  - below threshold on an already ACTIVE fact                -> skipped "would_overwrite_active_fact"
 *  - sensitive categories (contact_info, constraint) always "suggested" -> require owner approval
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
    deltaMessages: Array<{ id: string; speaker?: string }>;
  }
): Promise<{
  knowledgeUpserted: string[];
  knowledgeSuggested: string[];
  knowledgeInvalidated: string[];
  skipped: SkippedAction[];
}> {
  const { knowledgeActions, contactId, deltaMessages } = params;
  const deltaIds = new Set(deltaMessages.map((m) => m.id));
  const contactSpeakers = new Set(deltaMessages.filter((m) => m.speaker === "business").map((m) => m.id));

  const knowledgeUpserted: string[] = [];
  const knowledgeSuggested: string[] = [];
  const knowledgeInvalidated: string[] = [];
  const skipped: SkippedAction[] = [];
  const skip = (a: KnowledgeAction, reason: SkippedAction["reason"]) =>
    skipped.push({ kind: "knowledge", type: a.type, ref: a.key, reason });

  const SENSITIVE_CATEGORIES = new Set(["contact_info", "constraint"]);

  for (const action of knowledgeActions) {
    const sourceIds = (action.sourceMessageIds ?? []).filter((id) => deltaIds.has(id));
    const where = { contactId_key: { contactId, key: action.key } };
    const existing = await tx.contactKnowledge.findUnique({ where, select: { status: true } });
    const confident = action.confidence >= KNOWLEDGE_CONFIDENCE_THRESHOLD;

    // Check if all sources are from the contact's own speech
    const allFromContact = sourceIds.length > 0 && sourceIds.every((id) => contactSpeakers.has(id));
    // Check if category is sensitive
    const isSensitive = SENSITIVE_CATEGORIES.has(action.category);

    if (action.type === "upsert") {
      const value = typeof action.value === "string" ? action.value.trim() : "";
      if (!value || value.length > MAX_KNOWLEDGE_VALUE_CHARS) { skip(action, "invalid_value"); continue; }
      if (!confident && existing?.status === "active") { skip(action, "would_overwrite_active_fact"); continue; }

      // Facts from contact's own speech or sensitive categories are always "suggested"
      // However, if an existing fact is already active, keep it active unless confidence is low
      const shouldSuggest = !confident || (allFromContact && !existing) || (isSensitive && !existing);
      const status = shouldSuggest ? "suggested" : (existing?.status === "active" ? "active" : (confident ? "active" : "suggested"));
      const fact = await tx.contactKnowledge.upsert({
        where,
        create: { contactId, category: action.category, key: action.key, value, confidence: action.confidence, status },
        update: { category: action.category, value, confidence: action.confidence, status },
      });
      (status === "active" ? knowledgeUpserted : knowledgeSuggested).push(fact.id);

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
