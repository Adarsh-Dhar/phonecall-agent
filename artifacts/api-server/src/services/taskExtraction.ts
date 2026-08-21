/**
 * Conversation Extraction Service
 *
 * Watches conversations for new messages and mines both actionable tasks and
 * unanswered questions (queries) from them using the Gemini API. Runs on a
 * per-conversation debounce so rapid message exchanges are batched into a
 * single extraction call.
 *
 * Flow:
 *   new message saved
 *     → scheduleExtraction(conversationId)        // resets debounce timer
 *       → [N seconds of quiet]
 *         → runExtraction(conversationId)
 *           → fetch delta messages (since cursor)
 *           → fetch existing open tasks + pending queries
 *           → call Gemini with structured prompt
 *           → reconcile: create / update / complete / cancel tasks
 *           → reconcile: create / dismiss queries
 *           → advance cursor to latest message
 */

import { prisma } from "@workspace/db-prisma";
import { logger } from "../lib/logger";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

/** Milliseconds of silence before extraction fires. */
const DEBOUNCE_MS = 8_000;

/** If this many new messages pile up before the timer fires, run immediately. */
const HARD_CAP_MESSAGES = 6;

/**
 * Extractions with model confidence below this land as "suggested" rather than
 * jumping straight to "open". Configurable via env.
 */
const CONFIDENCE_THRESHOLD = parseFloat(
  process.env.TASK_CONFIDENCE_THRESHOLD ?? "0.85"
);

// ---------------------------------------------------------------------------
// In-process debounce state
// ---------------------------------------------------------------------------

interface PendingExtraction {
  timer: ReturnType<typeof setTimeout>;
  pendingCount: number;
}

const pending = new Map<string, PendingExtraction>();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Called after every new message is persisted. Resets the debounce timer for
 * the conversation. If the pending message count hits HARD_CAP_MESSAGES, fires
 * immediately instead of waiting.
 */
export function scheduleExtraction(conversationId: string): void {
  const existing = pending.get(conversationId);

  if (existing) {
    clearTimeout(existing.timer);
    existing.pendingCount += 1;

    if (existing.pendingCount >= HARD_CAP_MESSAGES) {
      pending.delete(conversationId);
      void runExtraction(conversationId);
      return;
    }
  }

  const entry: PendingExtraction = {
    pendingCount: (existing?.pendingCount ?? 0) + (existing ? 0 : 1),
    timer: setTimeout(() => {
      pending.delete(conversationId);
      void runExtraction(conversationId);
    }, DEBOUNCE_MS),
  };

  pending.set(conversationId, entry);
}

/**
 * Runs extraction immediately for a conversation, bypassing the debounce.
 * Used by the manual "extract now" API endpoint and by the debounce itself.
 *
 * Returns counts for tasks and queries created/updated so callers can surface
 * them in API responses.
 */
export async function runExtraction(conversationId: string): Promise<{
  created: string[];
  updated: string[];
  completed: string[];
  cancelled: string[];
  queriesCreated: string[];
  queriesDismissed: string[];
}> {
  const result = {
    created: [] as string[],
    updated: [] as string[],
    completed: [] as string[],
    cancelled: [] as string[],
    queriesCreated: [] as string[],
    queriesDismissed: [] as string[],
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "test_key" || apiKey === "test_key_for_testing") {
    logger.debug({ conversationId }, "extraction: skipped (no real API key)");
    return result;
  }

  try {
    // ------------------------------------------------------------------
    // 1. Load conversation + cursor
    // ------------------------------------------------------------------
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { contact: true },
    });
    if (!conversation) return result;

    // ------------------------------------------------------------------
    // 2. Fetch delta: messages newer than the cursor
    // ------------------------------------------------------------------
    const deltaMessages = await prisma.message.findMany({
      where: {
        conversationId,
        ...(conversation.lastExtractedMessageId
          ? {
              createdAt: {
                gt:
                  (
                    await prisma.message.findUnique({
                      where: { id: conversation.lastExtractedMessageId },
                    })
                  )?.createdAt ?? new Date(0),
              },
            }
          : {}),
      },
      orderBy: { createdAt: "asc" },
    });

    // Skip if too few new messages (not worth the API call)
    if (deltaMessages.length < 2) {
      logger.debug(
        { conversationId, delta: deltaMessages.length },
        "extraction: skipped (delta < 2)"
      );
      return result;
    }

    // ------------------------------------------------------------------
    // 3. Fetch existing open tasks and pending queries for this conversation
    // ------------------------------------------------------------------
    const openTasks = await prisma.task.findMany({
      where: {
        conversationId,
        status: { in: ["suggested", "open", "in_progress"] },
      },
      select: {
        id: true,
        title: true,
        description: true,
        dueDate: true,
        status: true,
        priority: true,
      },
    });

    const openQueries = await prisma.query.findMany({
      where: { conversationId, status: "pending" },
      select: { id: true, question: true, status: true },
    });

    // ------------------------------------------------------------------
    // 4. Build prompt and call Gemini
    // ------------------------------------------------------------------
    const { taskActions, queryActions } = await callGeminiExtraction(apiKey, {
      contactName: conversation.contact.name,
      contactBusiness: conversation.contact.business,
      existingTasks: openTasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        dueDate: t.dueDate?.toISOString() ?? null,
        status: t.status,
        priority: t.priority,
      })),
      existingOpenQueries: openQueries.map((q) => ({
        id: q.id,
        question: q.question,
        status: q.status,
      })),
      newMessages: deltaMessages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        time: m.time,
      })),
    });

    if (taskActions.length === 0 && queryActions.length === 0) {
      await advanceCursor(conversationId, deltaMessages);
      return result;
    }

    // ------------------------------------------------------------------
    // 5. Reconcile inside a single transaction
    // ------------------------------------------------------------------
    await prisma.$transaction(async (tx) => {
      // ---- Task actions ------------------------------------------------
      for (const action of taskActions) {
        const sourceIds: string[] = action.sourceMessageIds ?? [];

        if (action.type === "create") {
          const status =
            (action.confidence ?? 1) >= CONFIDENCE_THRESHOLD
              ? "open"
              : "suggested";
          const task = await tx.task.create({
            data: {
              title: action.title!,
              description: action.description,
              status,
              priority: action.priority ?? "normal",
              dueDate: action.dueDate ? new Date(action.dueDate) : null,
              confidence: action.confidence ?? 1,
              source: "agent",
              conversationId,
              contactId: conversation.contactId,
            },
          });
          result.created.push(task.id);

          for (const msgId of sourceIds) {
            if (deltaMessages.find((m) => m.id === msgId)) {
              await tx.taskSourceMessage.upsert({
                where: {
                  taskId_messageId_role: {
                    taskId: task.id,
                    messageId: msgId,
                    role: "created",
                  },
                },
                create: { taskId: task.id, messageId: msgId, role: "created" },
                update: {},
              });
            }
          }
        } else if (action.type === "update" && action.taskId) {
          await tx.task.update({
            where: { id: action.taskId },
            data: {
              ...(action.title ? { title: action.title } : {}),
              ...(action.description !== undefined
                ? { description: action.description }
                : {}),
              ...(action.priority ? { priority: action.priority } : {}),
              ...(action.dueDate
                ? { dueDate: new Date(action.dueDate) }
                : {}),
            },
          });
          result.updated.push(action.taskId);

          for (const msgId of sourceIds) {
            if (deltaMessages.find((m) => m.id === msgId)) {
              await tx.taskSourceMessage.upsert({
                where: {
                  taskId_messageId_role: {
                    taskId: action.taskId,
                    messageId: msgId,
                    role: "updated",
                  },
                },
                create: {
                  taskId: action.taskId,
                  messageId: msgId,
                  role: "updated",
                },
                update: {},
              });
            }
          }
        } else if (action.type === "complete" && action.taskId) {
          await tx.task.update({
            where: { id: action.taskId },
            data: { status: "done", completedAt: new Date() },
          });
          result.completed.push(action.taskId);

          for (const msgId of sourceIds) {
            if (deltaMessages.find((m) => m.id === msgId)) {
              await tx.taskSourceMessage.upsert({
                where: {
                  taskId_messageId_role: {
                    taskId: action.taskId,
                    messageId: msgId,
                    role: "completed",
                  },
                },
                create: {
                  taskId: action.taskId,
                  messageId: msgId,
                  role: "completed",
                },
                update: {},
              });
            }
          }
        } else if (action.type === "cancel" && action.taskId) {
          await tx.task.update({
            where: { id: action.taskId },
            data: { status: "cancelled" },
          });
          result.cancelled.push(action.taskId);

          for (const msgId of sourceIds) {
            if (deltaMessages.find((m) => m.id === msgId)) {
              await tx.taskSourceMessage.upsert({
                where: {
                  taskId_messageId_role: {
                    taskId: action.taskId,
                    messageId: msgId,
                    role: "completed",
                  },
                },
                create: {
                  taskId: action.taskId,
                  messageId: msgId,
                  role: "completed",
                },
                update: {},
              });
            }
          }
        }
      }

      // ---- Query actions -----------------------------------------------
      for (const action of queryActions) {
        const sourceIds: string[] = action.sourceMessageIds ?? [];

        if (action.type === "create") {
          const query = await tx.query.create({
            data: {
              question: action.question!,
              status: "pending",
              conversationId,
              contactId: conversation.contactId,
            },
          });
          result.queriesCreated.push(query.id);

          for (const msgId of sourceIds) {
            if (deltaMessages.find((m) => m.id === msgId)) {
              await tx.querySourceMessage.upsert({
                where: {
                  queryId_messageId_role: {
                    queryId: query.id,
                    messageId: msgId,
                    role: "asked",
                  },
                },
                create: {
                  queryId: query.id,
                  messageId: msgId,
                  role: "asked",
                },
                update: {},
              });
            }
          }
        } else if (action.type === "dismiss" && action.queryId) {
          await tx.query.update({
            where: { id: action.queryId },
            data: { status: "dismissed" },
          });
          result.queriesDismissed.push(action.queryId);

          for (const msgId of sourceIds) {
            if (deltaMessages.find((m) => m.id === msgId)) {
              await tx.querySourceMessage.upsert({
                where: {
                  queryId_messageId_role: {
                    queryId: action.queryId,
                    messageId: msgId,
                    role: "dismissed",
                  },
                },
                create: {
                  queryId: action.queryId,
                  messageId: msgId,
                  role: "dismissed",
                },
                update: {},
              });
            }
          }
        }
      }

      // Advance cursor inside the same transaction
      const latest = deltaMessages[deltaMessages.length - 1];
      await tx.conversation.update({
        where: { id: conversationId },
        data: {
          lastExtractedMessageId: latest.id,
          lastExtractedAt: new Date(),
        },
      });
    });

    logger.info(
      {
        conversationId,
        created: result.created.length,
        updated: result.updated.length,
        completed: result.completed.length,
        cancelled: result.cancelled.length,
        queriesCreated: result.queriesCreated.length,
        queriesDismissed: result.queriesDismissed.length,
      },
      "extraction: complete"
    );

    return result;
  } catch (err) {
    // Extraction is best-effort — log and leave the cursor unmoved so the
    // next debounce cycle retries with the same delta.
    logger.error({ err, conversationId }, "extraction: failed");
    return result;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function advanceCursor(
  conversationId: string,
  messages: Array<{ id: string }>
): Promise<void> {
  const latest = messages[messages.length - 1];
  if (!latest) return;
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastExtractedMessageId: latest.id, lastExtractedAt: new Date() },
  });
}

// ---------------------------------------------------------------------------
// Gemini extraction call
// ---------------------------------------------------------------------------

type ExistingTask = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: string;
  priority: string;
};

type ExistingQuery = {
  id: string;
  question: string;
  status: string;
};

type NewMessage = {
  id: string;
  role: string;
  content: string;
  time: string;
};

type TaskAction = {
  type: "create" | "update" | "complete" | "cancel";
  taskId?: string;
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: "low" | "normal" | "high";
  confidence: number;
  sourceMessageIds: string[];
};

type QueryAction = {
  type: "create" | "dismiss";
  queryId?: string;      // required for dismiss
  question?: string;     // required for create
  confidence: number;
  sourceMessageIds: string[];
};

async function callGeminiExtraction(
  apiKey: string,
  context: {
    contactName: string;
    contactBusiness: string;
    existingTasks: ExistingTask[];
    existingOpenQueries: ExistingQuery[];
    newMessages: NewMessage[];
  }
): Promise<{ taskActions: TaskAction[]; queryActions: QueryAction[] }> {
  const empty = { taskActions: [], queryActions: [] };

  const systemPrompt = `You review a conversation between a user and their Phone Agent assistant about a call to an external contact.
Your job: identify two types of things from the new messages:

1. TASKS — actionable items the assistant needs to do, follow up on, or that the user is waiting on.
2. QUERIES — questions that have been raised in the conversation (typically by the external contact or the assistant relaying them) that the USER still needs to answer before the agent can proceed.

Given the new messages and the existing open tasks/queries, return a JSON object with two keys: "taskActions" and "queryActions".

TASK action types:
  - "create":   a new task not covered by an existing one
  - "update":   new info changes an existing task (new due date, clarification, more detail)
  - "complete": the conversation shows an existing task is now resolved
  - "cancel":   the conversation shows an existing task no longer applies

QUERY action types:
  - "create":   a new question the user needs to answer (not already in existingOpenQueries)
  - "dismiss":  an existing open query that has now been resolved or is no longer relevant

Rules:
- For task "update", "complete", "cancel" — include taskId of the existing task.
- For query "dismiss" — include queryId of the existing query.
- confidence is a float 0.0–1.0 reflecting certainty.
- sourceMessageIds is the array of message IDs from new_messages that support this action.
- Only create a query when the contact or assistant is clearly waiting on input from the user.
- Do NOT create a query for anything already in existingOpenQueries.
- Do NOT create a query for questions the user has already answered.
- If nothing actionable, return empty arrays.
- Return ONLY valid JSON — no markdown fences, no explanation.

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
  "queryActions": [
    {
      "type": "create" | "dismiss",
      "queryId": "<string, required for dismiss>",
      "question": "<string, required for create — the exact question needing the user's answer>",
      "confidence": <number 0-1>,
      "sourceMessageIds": ["<messageId>", ...]
    }
  ]
}`;

  const userContent = `Contact: ${context.contactName} (${context.contactBusiness})

Existing open tasks:
${context.existingTasks.length === 0 ? "(none)" : JSON.stringify(context.existingTasks, null, 2)}

Existing pending queries (do NOT recreate these):
${context.existingOpenQueries.length === 0 ? "(none)" : JSON.stringify(context.existingOpenQueries, null, 2)}

New messages to analyse:
${JSON.stringify(context.newMessages, null, 2)}

Return the JSON object with taskActions and queryActions now.`;

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

  const queryActions = Array.isArray(parsed.queryActions)
    ? (parsed.queryActions as unknown[]).filter(
        (a): a is QueryAction =>
          typeof a === "object" &&
          a !== null &&
          ["create", "dismiss"].includes((a as QueryAction).type) &&
          typeof (a as QueryAction).confidence === "number" &&
          Array.isArray((a as QueryAction).sourceMessageIds)
      )
    : [];

  return { taskActions, queryActions };
}
