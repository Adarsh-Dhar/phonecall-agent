import type { ExistingTask, NewMessage, TaskAction, KnowledgeAction } from "./types";

// ---------------------------------------------------------------------------
// Gemini extraction call
// ---------------------------------------------------------------------------

export async function callGeminiExtraction(
  apiKey: string,
  context: {
    contactName: string;
    contactBusiness: string;
    existingTasks: ExistingTask[];
    newMessages: NewMessage[];
  }
): Promise<{ taskActions: TaskAction[]; knowledgeActions: KnowledgeAction[] }> {
  const empty = { taskActions: [], knowledgeActions: [] };

  const todayISO = new Date().toISOString().slice(0, 10); // e.g. "2026-09-05"

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
- For task "update", "complete", "cancel" — include taskId of the existing task.
- confidence is a float 0.0–1.0 reflecting certainty.
- dueDate: only set this if the conversation states (or unambiguously implies) BOTH a specific date AND a
  specific time — e.g. "Tuesday the 9th at 3pm" is fine, but "sometime next week" or "in the morning" is
  not specific enough. Never invent or guess a time of day that wasn't actually given. If only a vague
  timeframe was mentioned, leave dueDate unset entirely rather than picking an arbitrary time — a task
  with no due date is far better than one with a fabricated one.
- sourceMessageIds is the array of message IDs from new_messages that support this action.

Rules for knowledge:
- key must be a short, stable snake_case label (e.g. "preferred_contact_time").
  Reuse the same key when updating a fact you already know, so it overwrites rather than duplicates.
- category is one of: preference | fact | history | constraint | contact_info
- Only extract facts likely to matter in a future, unrelated conversation.

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

  const userContent = `Contact: ${context.contactName} (${context.contactBusiness})

Existing open tasks:
${context.existingTasks.length === 0 ? "(none)" : JSON.stringify(context.existingTasks, null, 2)}

New messages to analyse:
${JSON.stringify(context.newMessages, null, 2)}

Return the JSON object with taskActions and knowledgeActions now.`;

  const body = {
    contents: [{ role: "user", parts: [{ text: userContent }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      temperature: 0.2,        // low temperature — we want structured, deterministic output
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
    },
  };

  const model = "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      `Gemini extraction failed: ${response.status} — ${JSON.stringify(err)}`
    );
  }

  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const raw = payload.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? "")
    .join("")
    .trim();

  if (!raw) return empty;

  const parsed = JSON.parse(raw) as Record<string, unknown>;
  if (typeof parsed !== "object" || parsed === null) return empty;

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
