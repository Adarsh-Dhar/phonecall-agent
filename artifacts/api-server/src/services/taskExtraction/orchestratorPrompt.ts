import { callNebiusChat } from "../nebiusText";
import { extractJsonObject } from "../../lib/extractJson";
import { sanitizeExtraction } from "./validate";
import type { ExistingKnowledge, ExistingTask, KnowledgeAction, NewMessage, TaskAction } from "./types";

// ---------------------------------------------------------------------------
// Orchestrator extraction call. Goes through the shared Nebius client
// (services/nebiusText.ts) — timeouts, retries, fallback and metrics live there.
// ---------------------------------------------------------------------------

function resolveTimezone(timezone?: string): string {
  const defaultTz = process.env.DEFAULT_TIMEZONE || "Asia/Kolkata";
  const providedTz = timezone ?? defaultTz;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: providedTz });
    return providedTz;
  } catch {
    return defaultTz;
  }
}

export function resolveTodayISO(timezone?: string, now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: resolveTimezone(timezone) }).format(now);
}

/** "+05:30" style offset of `timezone` at `now`. */
export function utcOffsetFor(timezone?: string, now = new Date()): string {
  const tz = resolveTimezone(timezone);
  const part = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "longOffset" })
    .formatToParts(now)
    .find((p) => p.type === "timeZoneName")?.value; // "GMT+05:30" | "GMT"
  const m = part?.match(/GMT([+-]\d{2}:\d{2})/);
  return m ? m[1] : "+00:00";
}

export function buildExtractionPrompt(timezone?: string, now = new Date()): string {
  const tz = resolveTimezone(timezone);
  const todayISO = resolveTodayISO(tz, now);
  const offset = utcOffsetFor(tz, now);

  return `Today's date is ${todayISO} in the owner's timezone ${tz} (UTC${offset}). When resolving partial or relative dates (e.g. "7th of September", "next Monday"), always use this date as the reference and infer the correct year.

You review a conversation between the OWNER (the person who uses this app) and their Phone Agent assistant, which talks to an external CONTACT on the owner's behalf.
Each message has a "speaker":
  - "owner":   the app user. Their requests are tasks for the agent.
  - "agent":   the Phone Agent speaking for the owner.
  - "contact": the external person/business on the other side of the call or email.
A request made by the contact is NOT a task for the owner unless the owner or the agent explicitly agreed to do it. Do not blame or assign the contact's own requests to the owner.

Your job: identify two types of things from the new messages:

1. TASKS — actionable items the agent needs to do or follow up on, or that the owner is waiting on.
2. KNOWLEDGE — durable facts about this contact/business worth remembering for FUTURE conversations: hours, preferred contact method, account/reference numbers, past issues, stated preferences, constraints. Do NOT extract one-off task details here — those belong in taskActions.

Note: you do NOT generate questions/queries for the owner here. Queries are raised in a separate, dedicated flow. Do not attempt to replicate it.

Given the new messages, the existing open tasks and the facts already known about this contact, return a JSON object with two keys: "taskActions" and "knowledgeActions".

TASK action types:
  - "create":   a new task not covered by an existing one
  - "update":   new info changes an existing task (new due date, clarification, more detail)
  - "complete": the conversation shows an existing task is now resolved
  - "cancel":   the conversation shows an existing task no longer applies

KNOWLEDGE action types:
  - "upsert":     a new or updated durable fact
  - "invalidate": an existing fact (one listed under "Known facts") that is no longer true

Rules for tasks:
- For "update", "complete", "cancel" — taskId MUST be copied exactly from the existing open tasks list. Never invent an id. If no existing task matches, use "create" or do nothing.
- Do not create a task that duplicates an existing open task; use "update" instead.
- confidence is a float 0.0–1.0 reflecting certainty. Use >= 0.9 for complete/cancel/update only when the messages clearly state it.
- dueDate: only set this if the conversation states (or unambiguously implies) BOTH a specific date AND a specific time — e.g. "Tuesday the 9th at 3pm" is fine, but "sometime next week" or "in the morning" is not. Never invent a time of day. If only a vague timeframe was mentioned, leave dueDate unset. Format: ISO 8601 date-time WITH the UTC offset of the owner's timezone, e.g. "${todayISO}T15:00:00${offset}". A dueDate without an offset (or "Z") is invalid.
- kind: "call" if the task involves contacting the external person (phone call, email, etc.), "reminder" if it's a personal note or internal task that doesn't require contacting them. Default to "call" when in doubt.
- sourceMessageIds is the array of message IDs from new_messages that support this action. It must not be empty.

Rules for knowledge:
- key must be a short, stable snake_case label (e.g. "preferred_contact_time").
- If a fact under "Known facts" already covers the same thing, REUSE its exact key so it overwrites instead of duplicating. If the new messages contradict a known fact, upsert the same key with the new value (or "invalidate" it if nothing replaces it).
- "invalidate" may only target a key that appears under "Known facts".
- category is one of: preference | fact | history | constraint | contact_info
- Only extract facts likely to matter in a future, unrelated conversation.

Return ONLY valid JSON — no markdown fences, no explanation.

JSON schema:
{
  "taskActions": [
    {
      "type": "create" | "update" | "complete" | "cancel",
      "taskId": "<string, required for update/complete/cancel>",
      "title": "<string, required for create; optional for update>",
      "description": "<string, optional>",
      "dueDate": "<ISO 8601 with UTC offset, optional>",
      "priority": "low" | "normal" | "high",
      "kind": "call" | "reminder",
      "confidence": <number 0-1>,
      "sourceMessageIds": ["<messageId>", ...]
    }
  ],
  "knowledgeActions": [
    {
      "type": "upsert" | "invalidate",
      "category": "preference" | "fact" | "history" | "constraint" | "contact_info",
      "key": "<stable snake_case label>",
      "value": "<string, required for upsert>",
      "confidence": <number 0-1>,
      "sourceMessageIds": ["<messageId>", ...]
    }
  ]
}`;
}

export function buildExtractionUserContent(context: {
  contactName: string;
  contactBusiness: string | null;
  existingTasks: ExistingTask[];
  existingKnowledge: ExistingKnowledge[];
  newMessages: NewMessage[];
}): string {
  return `Contact: ${context.contactName} (${context.contactBusiness ?? ""})

Existing open tasks:
${context.existingTasks.length === 0 ? "(none)" : JSON.stringify(context.existingTasks, null, 2)}

Known facts about this contact:
${context.existingKnowledge.length === 0 ? "(none)" : JSON.stringify(context.existingKnowledge, null, 2)}

New messages to analyse:
${JSON.stringify(context.newMessages, null, 2)}

Return the JSON object with taskActions and knowledgeActions now.`;
}

/**
 * Parse + validate a model reply. THROWS on unparseable JSON so the caller
 * leaves the cursor unmoved and counts a failure — it never silently returns
 * "nothing found" for a reply it couldn't read.
 */
export function parseExtractionReply(raw: string) {
  return sanitizeExtraction(extractJsonObject(raw));
}

export async function callOrchestratorExtraction(
  _apiKey: string, // kept for call-site compatibility; the shared client reads NEBIUS_API_KEY
  context: {
    contactName: string;
    contactBusiness: string | null;
    existingTasks: ExistingTask[];
    existingKnowledge?: ExistingKnowledge[];
    newMessages: NewMessage[];
    timezone?: string;
  },
): Promise<{ taskActions: TaskAction[]; knowledgeActions: KnowledgeAction[]; dropped: number }> {
  const { text } = await callNebiusChat({
    purpose: "extraction",
    messages: [
      { role: "system", content: buildExtractionPrompt(context.timezone) },
      {
        role: "user",
        content: buildExtractionUserContent({ ...context, existingKnowledge: context.existingKnowledge ?? [] }),
      },
    ],
    temperature: 0.1,
    maxTokens: 4096,
    jsonResponse: true,
  });
  return parseExtractionReply(text);
}
