import { logger } from "../../lib/logger";
import { generateOrchestratorText, OrchestratorEmptyResponseError } from "../nebiusText";
import type { ExistingTask, NewMessage, TaskAction, KnowledgeAction } from "./types";

// ---------------------------------------------------------------------------
// Orchestrator extraction call. The Nebius transport (URL, key, model,
// fallback, error handling) lives in services/nebiusText.ts — this file only
// owns the extraction prompt and response parsing.
// ---------------------------------------------------------------------------

/** Max characters of raw model output included in the opt-in debug log. */
const RAW_DEBUG_PREVIEW_CHARS = 500;

export function resolveTodayISO(timezone?: string, now = new Date()): string {
  const defaultTz = process.env.DEFAULT_TIMEZONE || "Asia/Kolkata";
  const providedTz = timezone ?? defaultTz;
  let tz = defaultTz;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: providedTz });
    tz = providedTz;
  } catch {
    /* keep default */
  }
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(now);
}

export async function callOrchestratorExtraction(
  context: {
    contactName: string;
    contactBusiness: string | null;
    existingTasks: ExistingTask[];
    newMessages: NewMessage[];
    timezone?: string;
    /** Only used to correlate log lines; never sent to the model. */
    conversationId?: string;
  }
): Promise<{ taskActions: TaskAction[]; knowledgeActions: KnowledgeAction[] }> {
  const empty = { taskActions: [], knowledgeActions: [] };

  const todayISO = resolveTodayISO(context.timezone);

  const systemPrompt = `Today's date is ${todayISO}. When resolving partial or relative dates (e.g. "7th of September", "next Monday"), always use this date as the reference and infer the correct year.

You review a conversation between a user and their Phone Agent assistant with an external contact.
Your job: identify two types of things from the new messages:

1. TASKS — actionable items the assistant needs to do, follow up on, or that the user is waiting on.
2. KNOWLEDGE — durable facts about this contact/business worth remembering for FUTURE conversations (not just this one): hours, preferred contact method, account/reference numbers, past issues, stated preferences, constraints. Do NOT extract one-off task details here — those belong in taskActions.

Note: you do NOT generate questions/queries for the user here. Queries are only ever raised separately, when the agent can't confidently answer an inbound email — that is a different, dedicated flow. Do not attempt to replicate it.

Given the new messages and the existing open tasks, return a JSON object with two keys: "taskActions" and "knowledgeActions".

TASK action types:
  - "create":   a new task not covered by an existing one
  - "update":   new info changes an existing task (new due date, clarification, more detail)
  - "complete": the conversation shows an existing task is now resolved
  - "cancel":   the conversation shows an existing task no longer applies

KNOWLEDGE action types:
  - "upsert":     a new or updated durable fact
  - "invalidate": an existing fact (matched by key) that is no longer true

Rules for tasks:
|- For task "update", "complete", "cancel" — include taskId of the existing task.
|- confidence is a float 0.0–1.0 reflecting certainty.
|- dueDate: only set this if the conversation states (or unambiguously implies) BOTH a specific date AND a
  specific time — e.g. "Tuesday the 9th at 3pm" is fine, but "sometime next week" or "in the morning" is
  not specific enough. Never invent or guess a time of day that wasn't actually given. If only a vague
  timeframe was mentioned, leave dueDate unset entirely rather than picking an arbitrary time — a task
  with no due date is far better than one with a fabricated one.
|- kind: "call" if the task involves contacting the external person (phone call, email, etc.), "reminder" if it's a personal note or internal task that doesn't require contacting them. Default to "call" when in doubt.
|- sourceMessageIds is the array of message IDs from new_messages that support this action.

Rules for knowledge:
|- key must be a short, stable snake_case label (e.g. "preferred_contact_time").
  Reuse the same key when updating a fact you already know, so it overwrites rather than duplicates.
|- category is one of: preference | fact | history | constraint | contact_info
|- Only extract facts likely to matter in a future, unrelated conversation.

If nothing actionable, return empty arrays.
Return ONLY valid JSON — no markdown fences, no explanation.

JSON schema:
{
  "taskActions": [
    {
      "type": "create" | "update" | "complete" | "cancel",
      "taskId": "<string, required for update/complete/cancel>",
      "title": "<string, required for create; optional for update>",
      "description": "<string, optional>",
      "dueDate": "<ISO 8601 string, optional>",
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

  const userContent = `Contact: ${context.contactName} (${context.contactBusiness ?? ""})

Existing open tasks:
${context.existingTasks.length === 0 ? "(none)" : JSON.stringify(context.existingTasks, null, 2)}

New messages to analyse:
${JSON.stringify(context.newMessages, null, 2)}

Return the JSON object with taskActions and knowledgeActions now.`;

  let raw: string;
  try {
    const result = await generateOrchestratorText({
      systemInstructionText: systemPrompt,
      turns: [{ role: "user", content: userContent }],
      jsonResponse: true,
      temperature: 0.2, // low temperature — we want structured, deterministic output
      maxTokens: 4096,
    });
    raw = result.text;
  } catch (err) {
    // An empty reply means "nothing to extract" (the caller advances the
    // cursor). Any other failure (HTTP error, network, missing key) is
    // rethrown so the cursor stays put and the next cycle retries.
    if (err instanceof OrchestratorEmptyResponseError) return empty;
    throw err;
  }

  // Try to extract JSON from the response - handle cases where the model
  // wraps JSON in markdown code blocks or adds conversational text
  let jsonStr = raw;

  // Try to find JSON in markdown code blocks
  const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  }

  // Try to find a JSON object in the text (find first { and last })
  const firstBrace = jsonStr.indexOf('{');
  const lastBrace = jsonStr.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
  }

  try {
    const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
    if (typeof parsed !== "object" || parsed === null) return empty;
    return parseActions(parsed);
  } catch (e) {
    // The model output is derived from call transcripts, so it must not be
    // dumped into logs by default: log only metadata. Do NOT log `e` itself —
    // V8's JSON.parse messages quote a snippet of the input. A truncated
    // preview is available for debugging when opted in via LOG_LLM_RAW=1.
    logger.error(
      {
        errorName: e instanceof Error ? e.name : typeof e,
        conversationId: context.conversationId,
        rawChars: raw.length,
        jsonChars: jsonStr.length,
      },
      "orchestrator extraction: could not parse model response"
    );
    if (process.env.LOG_LLM_RAW === "1") {
      logger.debug(
        { conversationId: context.conversationId, rawPreview: raw.slice(0, RAW_DEBUG_PREVIEW_CHARS) },
        "orchestrator extraction: raw model response (truncated, LOG_LLM_RAW=1)"
      );
    }
    return empty;
  }
}

function parseActions(parsed: Record<string, unknown>) {
  const empty = { taskActions: [], knowledgeActions: [] };

  const taskActions = Array.isArray(parsed.taskActions)
    ? (parsed.taskActions as unknown[]).filter(
        (a): a is TaskAction =>
          typeof a === "object" &&
          a !== null &&
          ["create", "update", "complete", "cancel"].includes(
            (a as TaskAction).type
          ) &&
          typeof (a as TaskAction).confidence === "number" &&
          Array.isArray((a as TaskAction).sourceMessageIds)
      )
    : [];

  const knowledgeActions = Array.isArray(parsed.knowledgeActions)
    ? (parsed.knowledgeActions as unknown[]).filter(
        (a): a is KnowledgeAction =>
          typeof a === "object" &&
          a !== null &&
          ["upsert", "invalidate"].includes((a as KnowledgeAction).type) &&
          typeof (a as KnowledgeAction).key === "string" &&
          typeof (a as KnowledgeAction).confidence === "number" &&
          Array.isArray((a as KnowledgeAction).sourceMessageIds)
      )
    : [];

  return { taskActions, knowledgeActions };
}
