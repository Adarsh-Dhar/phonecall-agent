/**
 * Conversation Extraction Service
 *
 * Watches conversations for new messages and mines actionable tasks and
 * durable knowledge facts from them using the Gemini API. Runs on a
 * per-conversation debounce so rapid message exchanges are batched into a
 * single extraction call.
 *
 * NOTE: Query/question generation is NOT part of this pipeline. Queries are
 * only ever created from the isEnoughKnowledge escalation path in
 * emailReply.ts / routes/emails.ts — when the agent can't confidently answer
 * an inbound email, it sends a holding reply and raises exactly one query for
 * the user. Answering that query upserts the missing fact into
 * ContactKnowledge so future emails can be answered directly.
 *
 * Flow:
 *   new message saved
 *     → scheduleExtraction(conversationId)        // resets debounce timer
 *       → [N seconds of quiet]
 *         → runExtraction(conversationId)
 *           → fetch delta messages (since cursor)
 *           → fetch existing open tasks
 *           → call Gemini with structured prompt
 *           → reconcile: create / update / complete / cancel tasks
 *           → reconcile: upsert / invalidate knowledge facts
 *           → advance cursor to latest message
 *
 * This module is split into focused files (all internal — everything callers
 * need is re-exported here, so `from "./services/taskExtraction"` /
 * `from "../services/taskExtraction"` keeps resolving exactly as before):
 *   config.ts             — debounce/threshold constants
 *   types.ts               — shared types (TaskAction, KnowledgeAction, ...)
 *   scheduler.ts           — scheduleExtraction, sweepStaleConversations
 *   runExtraction.ts       — the orchestrator
 *   geminiPrompt.ts         — callGeminiExtraction
 *   reconcileTasks.ts      — task create/update/complete/cancel
 *   reconcileKnowledge.ts  — knowledge upsert/invalidate
 *   cursor.ts              — advanceCursor
 *   autoEnd.ts             — checkAndAutoEndConversation
 */

export { scheduleExtraction, sweepStaleConversations } from "./scheduler";
export { runExtraction } from "./runExtraction";
