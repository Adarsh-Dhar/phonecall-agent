import {
  KNOWLEDGE_CONFIDENCE_THRESHOLD,
  MAX_KNOWLEDGE_VALUE_CHARS,
} from "./config";
import type { KnowledgeAction, SkippedAction, TxClient } from "./types";

/**
 * Applies knowledge actions (upsert/invalidate) inside the caller's transaction.
 *
 * Trust rules — every "active" fact is read aloud to the live voice agent as
 * something it can state directly, so the model alone must not be able to put
 * an unreliable fact there or knock out a trusted one:
 *  - upsert at/above KNOWLEDGE_CONFIDENCE_THRESHOLD  -> "active"
 *  - upsert below it                                 -> "suggested" (ignored by
 *    every reader, which only load status "active"; a person approves it with
 *    PATCH /knowledge/:id { status: "active" })
 *  - a low-confidence upsert never overwrites an existing ACTIVE fact
 *  - invalidating an ACTIVE fact needs the same high confidence
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

  const knowledgeUpserted: string[] = [];
  const knowledgeSuggested: string[] = [];
  const knowledgeInvalidated: string[] = [];
  const skipped: SkippedAction[] = [];

  const deltaIds = new Set(deltaMessages.map((m) => m.id));

  for (const action of knowledgeActions) {
    const sourceIds = (action.sourceMessageIds ?? []).filter((id) => deltaIds.has(id));
    const isHigh = action.confidence >= KNOWLEDGE_CONFIDENCE_THRESHOLD;

    if (action.type === "upsert") {
      const value = typeof action.value === "string" ? action.value.trim() : "";
      const key = action.key.trim();
      if (!value || !key || value.length > MAX_KNOWLEDGE_VALUE_CHARS) {
        skipped.push({ kind: "knowledge", type: "upsert", ref: key || undefined, reason: "invalid_value" });
        continue;
      }

      const existing = await tx.contactKnowledge.findUnique({
        where: { contactId_key: { contactId, key } },
      });

      if (existing?.status === "active" && !isHigh) {
        skipped.push({ kind: "knowledge", type: "upsert", ref: key, reason: "would_overwrite_active_fact" });
        continue;
      }

      const status = isHigh ? "active" : "suggested";
      const fact = await tx.contactKnowledge.upsert({
        where: { contactId_key: { contactId, key } },
        create: {
          contactId,
          category: action.category,
          key,
          value,
          confidence: action.confidence,
          status,
        },
        update: {
          category: action.category,
          value,
          confidence: action.confidence,
          status,
        },
      });
      (isHigh ? knowledgeUpserted : knowledgeSuggested).push(fact.id);

      for (const msgId of sourceIds) {
        await tx.knowledgeSourceMessage.upsert({
          where: {
            knowledgeId_messageId_role: { knowledgeId: fact.id, messageId: msgId, role: "updated" },
          },
          create: { knowledgeId: fact.id, messageId: msgId, role: "updated" },
          update: {},
        });
      }
    } else if (action.type === "invalidate") {
      const key = action.key.trim();
      const target = await tx.contactKnowledge.findUnique({
        where: { contactId_key: { contactId, key } },
      });
      if (!target || target.status === "stale") {
        skipped.push({ kind: "knowledge", type: "invalidate", ref: key, reason: "unknown_fact" });
        continue;
      }
      // A suggested fact was never trusted, so dropping it needs no confidence.
      if (target.status === "active" && !isHigh) {
        skipped.push({ kind: "knowledge", type: "invalidate", ref: key, reason: "low_confidence" });
        continue;
      }
      await tx.contactKnowledge.update({
        where: { contactId_key: { contactId, key } },
        data: { status: "stale" },
      });
      knowledgeInvalidated.push(key);
    }
  }

  return { knowledgeUpserted, knowledgeSuggested, knowledgeInvalidated, skipped };
}
