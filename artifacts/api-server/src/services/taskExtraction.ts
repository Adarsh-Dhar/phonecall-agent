/**
 * Task Extraction Service
 *
 * Watches conversations for new messages and mines actionable tasks from them
 * using the Gemini API. Runs on a per-conversation debounce so rapid message
 * exchanges are batched into a single extraction call.
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
 * Returns the array of task ids that were created or updated, so callers can
 * return them in an API response if needed.
 */
export async function runExtraction(
  conversationId: string
): Promise<{ created: string[]; updated: string[]; completed: string[]; cancelled: string[] }> {
  const result = { created: [] as string[], updated: [] as string[], completed: [] as string[], cancelled: [] as string[] };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "test_key" || apiKey === "test_key_for_testing") {
    logger.debug({ conversationId }, "task-extraction: skipped (no real API key)");
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
          ? { createdAt: { gt: (await prisma.message.findUnique({ where: { id: conversation.lastExtractedMessageId } }))?.createdAt ?? new Date(0) } }
          : {}),
      },
      orderBy: { createdAt: "asc" },
    });

    // Skip if too few new messages (not worth the API call)
    if (deltaMessages.length < 2) {
      logger.debug({ conversationId, delta: deltaMessages.length }, "task-extraction: skipped (delta < 2)");
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
      select: { id: true, title: true, description: true, dueDate: true, status: true, priority: true },
    });

    // ------------------------------------------------------------------
    // 4. Build prompt and call Gemini
    // ------------------------------------------------------------------
    const actions = await callGeminiExtraction(apiKey, {
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

    if (!actions || actions.length === 0) {
      // Advance cursor even if no tasks were found
      await advanceCursor(conversationId, deltaMessages);
      return result;
    }

    // ------------------------------------------------------------------
    // 5. Reconcile: apply each action inside a transaction
    // ------------------------------------------------------------------
    await prisma.$transaction(async (tx) => {
      for (const action of actions) {
        const sourceIds: string[] = action.sourceMessageIds ?? [];

        if (action.type === "create") {
          const status = (action.confidence ?? 1) >= CONFIDENCE_THRESHOLD ? "open" : "suggested";
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

          // Link source messages
          for (const msgId of sourceIds) {
            if (deltaMessages.find((m) => m.id === msgId)) {
              await tx.taskSourceMessage.upsert({
                where: { taskId_messageId_role: { taskId: task.id, messageId: msgId, role: "created" } },
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
              ...(action.description !== undefined ? { description: action.description } : {}),
              ...(action.priority ? { priority: action.priority } : {}),
              ...(action.dueDate ? { dueDate: new Date(action.dueDate) } : {}),
            },
          });
          result.updated.push(action.taskId);

          for (const msgId of sourceIds) {
            if (deltaMessages.find((m) => m.id === msgId)) {
              await tx.taskSourceMessage.upsert({
                where: { taskId_messageId_role: { taskId: action.taskId, messageId: msgId, role: "updated" } },
                create: { taskId: action.taskId, messageId: msgId, role: "updated" },
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
                where: { taskId_messageId_role: { taskId: action.taskId, messageId: msgId, role: "completed" } },
                create: { taskId: action.taskId, messageId: msgId, role: "completed" },
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
                where: { taskId_messageId_role: { taskId: action.taskId, messageId: msgId, role: "completed" } },
                create: { taskId: action.taskId, messageId: msgId, role: "completed" },
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
      { conversationId, created: result.created.length, updated: result.updated.length, completed: result.completed.length, cancelled: result.cancelled.length },
      "task-extraction: complete"
    );

    return result;
  } catch (err) {
    // Extraction is best-effort — log and leave the cursor unmoved so the
    // next debounce cycle retries with the same delta.
    logger.error({ err, conversationId }, "task-extraction: failed");
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

type NewMessage = {
  id: string;
  role: string;
  content: string;
  time: string;
};

type ExtractionAction = {
  type: "create" | "update" | "complete" | "cancel";
  taskId?: string;
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: "low" | "normal" | "high";
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
): Promise<ExtractionAction[]> {
  const systemPrompt = `You review a conversation between a user and their Phone Agent assistant about a call to an external contact.
Your job: identify actionable items — things the assistant needs to do, follow up on, or that the user is waiting on.

Given the new messages and the list of tasks already known for this conversation, return a JSON array of actions.
Each action must have one of these types:
  - "create":   a new task not covered by an existing one
  - "update":   new info changes an existing task (new due date, clarification, more detail)
  - "complete": the conversation shows an existing task is now resolved
  - "cancel":   the conversation shows an existing task no longer applies

Rules:
- For "update", "complete", "cancel" you MUST include the taskId of the existing task being affected.
- confidence is a float 0.0–1.0 reflecting how certain you are this is a real actionable item (not small talk).
- sourceMessageIds is the array of message IDs from the new_messages list that support this action.
- If nothing actionable is present, return an empty array [].
- Return ONLY valid JSON — no markdown fences, no explanation.

JSON schema for each action:
{
  "type": "create" | "update" | "complete" | "cancel",
  "taskId": "<string, required for update/complete/cancel>",
  "title": "<string, required for create; optional for update>",
  "description": "<string, optional>",
  "dueDate": "<ISO 8601 string, optional>",
  "priority": "low" | "normal" | "high",
  "confidence": <number 0-1>,
  "sourceMessageIds": ["<messageId>", ...]
}`;

  const userContent = `Contact: ${context.contactName} (${context.contactBusiness})

Existing open tasks:
${context.existingTasks.length === 0 ? "(none)" : JSON.stringify(context.existingTasks, null, 2)}

New messages to analyse:
${JSON.stringify(context.newMessages, null, 2)}

Return the JSON array of actions now.`;

  const body = {
    contents: [{ role: "user", parts: [{ text: userContent }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      temperature: 0.2,        // low temperature — we want structured, deterministic output
      maxOutputTokens: 2048,
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
    throw new Error(`Gemini extraction failed: ${response.status} — ${JSON.stringify(err)}`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const raw = payload.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? "")
    .join("")
    .trim();

  if (!raw) return [];

  // Parse and validate the returned JSON
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];

  return parsed.filter(
    (a): a is ExtractionAction =>
      typeof a === "object" &&
      a !== null &&
      ["create", "update", "complete", "cancel"].includes(a.type) &&
      typeof a.confidence === "number" &&
      Array.isArray(a.sourceMessageIds)
  );
}
