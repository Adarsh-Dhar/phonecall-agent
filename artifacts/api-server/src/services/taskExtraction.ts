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
 */

import { prisma } from "@workspace/db-prisma";
import { logger } from "../lib/logger";
import { endConversation } from "./conversations";
import { syncTaskToCalendar } from "./googleCalendar";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

/** Milliseconds of silence before extraction fires. */
const DEBOUNCE_MS = parseInt(process.env.EXTRACTION_DEBOUNCE_MS ?? "5000", 10);

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
 * On server startup, find conversations that have messages newer than their
 * extraction cursor and schedule extraction for them. This recovers from
 * restarts that killed in-flight debounce timers.
 */
export async function sweepStaleConversations(): Promise<void> {
  try {
    // Find conversations where a message exists that is newer than the cursor
    const stale = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT DISTINCT c.id
      FROM "Conversation" c
      JOIN "Message" m ON m."conversationId" = c.id
      LEFT JOIN "Message" cursor_msg ON cursor_msg.id = c."lastExtractedMessageId"
      WHERE cursor_msg.id IS NULL
         OR m."createdAt" > cursor_msg."createdAt"
    `;
    if (stale.length > 0) {
      logger.info({ count: stale.length }, "startup sweep: scheduling extraction for stale conversations");
      for (const { id } of stale) {
        scheduleExtraction(id);
      }
    }
  } catch (err) {
    logger.warn({ err }, "startup sweep: failed");
  }
}

/**
 * Runs extraction immediately for a conversation, bypassing the debounce.
 * Used by the manual "extract now" API endpoint and by the debounce itself.
 *
 * Returns counts for tasks and knowledge created/updated so callers can surface
 * them in API responses.
 */
export async function runExtraction(conversationId: string): Promise<{
  created: string[];
  updated: string[];
  completed: string[];
  cancelled: string[];
  knowledgeUpserted: string[];
  knowledgeInvalidated: string[];
}> {
  const result = {
    created: [] as string[],
    updated: [] as string[],
    completed: [] as string[],
    cancelled: [] as string[],
    knowledgeUpserted: [] as string[],
    knowledgeInvalidated: [] as string[],
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    logger.debug({ conversationId }, "extraction: skipped (no API key)");
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
    // 3. Fetch existing open tasks for this conversation
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

    // ------------------------------------------------------------------
    // 4. Build prompt and call Gemini
    // ------------------------------------------------------------------
    const { taskActions, knowledgeActions } = await callGeminiExtraction(apiKey, {
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
      newMessages: deltaMessages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        time: m.time,
      })),
    });

    if (taskActions.length === 0 && knowledgeActions.length === 0) {
      await advanceCursor(conversationId, deltaMessages);
      return result;
    }

    // ------------------------------------------------------------------
    // 5. Reconcile inside a single transaction
    // ------------------------------------------------------------------
    const tasksToSync: Array<{
      id: string;
      title: string;
      description: string | null;
      dueDate: Date | null;
      status: string;
      googleEventId: string | null;
      contact: { name: string; business: string };
    }> = [];

    await prisma.$transaction(async (tx) => {      // ---- Task actions ------------------------------------------------
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

          // Collect for calendar sync if has due date
          if (action.dueDate) {
            tasksToSync.push({
              id: task.id,
              title: task.title,
              description: task.description,
              dueDate: task.dueDate,
              status: task.status,
              googleEventId: task.googleEventId,
              contact: { name: conversation.contact.name, business: conversation.contact.business },
            });
          }

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
          const updatedTask = await tx.task.update({
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

          // Collect for calendar sync if has due date change
          if (action.dueDate) {
            tasksToSync.push({
              id: updatedTask.id,
              title: updatedTask.title,
              description: updatedTask.description,
              dueDate: updatedTask.dueDate,
              status: updatedTask.status,
              googleEventId: updatedTask.googleEventId,
              contact: { name: conversation.contact.name, business: conversation.contact.business },
            });
          }

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

      // ---- Knowledge actions ---------------------------------------------
      for (const action of knowledgeActions) {
        const sourceIds: string[] = action.sourceMessageIds ?? [];

        if (action.type === "upsert" && action.value) {
          const fact = await tx.contactKnowledge.upsert({
            where: { contactId_key: { contactId: conversation.contactId, key: action.key } },
            create: {
              contactId: conversation.contactId,
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
          result.knowledgeUpserted.push(fact.id);

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
            where: { contactId: conversation.contactId, key: action.key },
            data: { status: "stale" },
          });
          result.knowledgeInvalidated.push(action.key);
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
    }, { timeout: 30_000 });

    // Sync tasks to Google Calendar (non-blocking, after transaction)
    for (const taskToSync of tasksToSync) {
      syncTaskToCalendar(taskToSync).catch((err) => {
        console.error("Failed to sync task to calendar:", err);
      });
    }

    logger.info(
      {
        conversationId,
        created: result.created.length,
        updated: result.updated.length,
        completed: result.completed.length,
        cancelled: result.cancelled.length,
        knowledgeUpserted: result.knowledgeUpserted.length,
        knowledgeInvalidated: result.knowledgeInvalidated.length,
      },
      "extraction: complete"
    );

    // Auto-end conversation if all tasks are completed and no pending queries
    await checkAndAutoEndConversation(conversationId);

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

/**
 * Check if a conversation should be auto-ended:
 * - All tasks are completed (done or cancelled)
 * - No pending queries exist for this conversation
 * - Conversation is currently active
 * - At least one task or query was ever created (avoid auto-ending empty conversations)
 */
async function checkAndAutoEndConversation(conversationId: string): Promise<void> {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation || conversation.status !== "active") {
      return; // Only auto-end active conversations
    }

    // Check total tasks and queries ever created for this conversation
    const totalTasks = await prisma.task.count({
      where: { conversationId },
    });

    const totalQueries = await prisma.query.count({
      where: { conversationId },
    });

    // Guard: don't auto-end conversations that never had any tasks or queries
    // (e.g., simple small talk that didn't mine anything actionable)
    if (totalTasks === 0 && totalQueries === 0) {
      logger.debug(
        { conversationId },
        "auto-end: skipped (no tasks or queries ever created)"
      );
      return;
    }

    // Check for any active tasks (not done/cancelled)
    const activeTasks = await prisma.task.count({
      where: {
        conversationId,
        status: { in: ["suggested", "open", "in_progress"] },
      },
    });

    if (activeTasks > 0) {
      logger.debug(
        { conversationId, activeTasks },
        "auto-end: skipped (active tasks exist)"
      );
      return;
    }

    // Check for pending queries
    const pendingQueries = await prisma.query.count({
      where: {
        conversationId,
        status: "pending",
      },
    });

    if (pendingQueries > 0) {
      logger.debug(
        { conversationId, pendingQueries },
        "auto-end: skipped (pending queries exist)"
      );
      return;
    }

    // All conditions met - end the conversation using the shared service
    logger.info(
      { conversationId },
      "auto-end: ending conversation (all tasks done, no pending queries)"
    );
    
    await endConversation(conversationId);
  } catch (err) {
    logger.error({ err, conversationId }, "auto-end: failed to check/end conversation");
  }
}

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

type KnowledgeAction = {
  type: "upsert" | "invalidate";
  category: "preference" | "fact" | "history" | "constraint" | "contact_info";
  key: string;
  value?: string;          // required for upsert
  confidence: number;
  sourceMessageIds: string[];
};

async function callGeminiExtraction(
  apiKey: string,
  context: {
    contactName: string;
    contactBusiness: string;
    existingTasks: ExistingTask[];
    newMessages: NewMessage[];
  }
): Promise<{ taskActions: TaskAction[]; knowledgeActions: KnowledgeAction[] }> {
  const empty = { taskActions: [], knowledgeActions: [] };

  const systemPrompt = `You review a conversation between a user and their Phone Agent assistant with an external contact.
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
