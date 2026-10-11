import { logger } from "../../lib/logger";
import { ACTION_CONFIDENCE_THRESHOLD, CONFIDENCE_THRESHOLD } from "./config";
import { parseModelDueDate } from "./validate";
import type { SkippedAction, TaskAction, TaskToSync, TxClient } from "./types";

export { parseModelDueDate } from "./validate";

const ACTIVE_STATUSES = ["suggested", "open", "in_progress"];
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

/**
 * Applies task actions (create/update/complete/cancel) inside the caller's
 * transaction. Model output is untrusted, so every action is checked:
 *  - update/complete/cancel must target an ACTIVE task in THIS conversation
 *  - they need confidence >= ACTION_CONFIDENCE_THRESHOLD and at least one
 *    cited message from the delta
 *  - due dates must carry a UTC offset and be a sane future time; a bad date
 *    drops only the date, never the whole batch
 *  - a create that duplicates an active task's title is skipped
 * Skipped actions are returned (and logged) rather than thrown.
 */
export async function reconcileTaskActions(
  tx: TxClient,
  params: {
    taskActions: TaskAction[];
    conversationId: string;
    contactId: string;
    contactName: string;
    contactBusiness: string | null;
    deltaMessages: Array<{ id: string }>;
    now?: Date;
  }
): Promise<{
  created: string[];
  updated: string[];
  completed: string[];
  cancelled: string[];
  skipped: SkippedAction[];
  tasksToSync: TaskToSync[];
}> {
  const { taskActions, conversationId, contactId, contactName, contactBusiness, deltaMessages } = params;
  const now = params.now ?? new Date();

  const created: string[] = [];
  const updated: string[] = [];
  const completed: string[] = [];
  const cancelled: string[] = [];
  const skipped: SkippedAction[] = [];
  const tasksToSync: TaskToSync[] = [];

  const deltaIds = new Set(deltaMessages.map((m) => m.id));
  const activeRows = await tx.task.findMany({
    where: { conversationId, status: { in: ACTIVE_STATUSES } },
    select: { id: true, title: true },
  });
  const activeIds = new Set(activeRows.map((t) => t.id));
  const activeTitles = new Set(activeRows.map((t) => norm(t.title)));

  const skip = (a: TaskAction, reason: SkippedAction["reason"]) => {
    skipped.push({ kind: "task", type: a.type, ref: a.taskId, reason });
    logger.warn({ conversationId, type: a.type, taskId: a.taskId, reason }, "reconcileTasks: action skipped");
  };

  const syncPayload = (t: {
    id: string; title: string; description: string | null; dueDate: Date | null;
    status: string; googleEventId: string | null;
  }): TaskToSync => ({
    id: t.id, title: t.title, description: t.description, dueDate: t.dueDate,
    status: t.status, googleEventId: t.googleEventId,
    contact: { name: contactName, business: contactBusiness },
  });

  async function linkSources(taskId: string, ids: string[], role: string) {
    for (const messageId of ids) {
      await tx.taskSourceMessage.upsert({
        where: { taskId_messageId_role: { taskId, messageId, role } },
        create: { taskId, messageId, role },
        update: {},
      });
    }
  }

  for (const action of taskActions) {
    const sourceIds = (action.sourceMessageIds ?? []).filter((id) => deltaIds.has(id));

    // ---------------- create ----------------
    if (action.type === "create") {
      const title = action.title?.trim();
      if (!title) { skip(action, "empty title"); continue; }
      if (activeTitles.has(norm(title))) { skip(action, "duplicate of an active task"); continue; }

      const due = action.dueDate ? parseModelDueDate(action.dueDate, now) : null;
      if (action.dueDate && !due) {
        logger.warn({ conversationId, dueDate: action.dueDate }, "reconcileTasks: invalid dueDate dropped on create");
      }

      const status = (action.confidence ?? 1) >= CONFIDENCE_THRESHOLD ? "open" : "suggested";
      const task = await tx.task.create({
        data: {
          title,
          description: action.description,
          status,
          priority: action.priority ?? "normal",
          dueDate: due,
          confidence: action.confidence ?? 1,
          source: "agent",
          conversationId,
          contactId,
          kind: action.kind ?? "call",
          nextAttemptAt: due,
          callAttempts: 0,
          schedulerStatus: "pending",
        },
      });
      created.push(task.id);
      activeIds.add(task.id);
      activeTitles.add(norm(title));
      if (due) tasksToSync.push(syncPayload(task));
      await linkSources(task.id, sourceIds, "created");
      continue;
    }

    // ------------- update / complete / cancel -------------
    const taskId = action.taskId;
    if (!taskId || !activeIds.has(taskId)) { skip(action, "taskId is not an active task in this conversation"); continue; }
    if ((action.confidence ?? 0) < ACTION_CONFIDENCE_THRESHOLD) { skip(action, "confidence below action threshold"); continue; }
    if (sourceIds.length === 0) { skip(action, "no cited message from the new messages"); continue; }

    if (action.type === "update") {
      const data: Record<string, unknown> = {
        ...(action.title ? { title: action.title } : {}),
        ...(action.description !== undefined ? { description: action.description } : {}),
        ...(action.priority ? { priority: action.priority } : {}),
      };

      if (action.dueDate !== undefined) {
        const due = parseModelDueDate(action.dueDate, now);
        if (due) {
          data.dueDate = due;
          data.nextAttemptAt = due;
          data.callAttempts = 0;
          data.schedulerStatus = "pending";
        } else {
          logger.warn({ conversationId, taskId, dueDate: action.dueDate }, "reconcileTasks: invalid dueDate dropped on update");
        }
      }
      if (Object.keys(data).length === 0) { skip(action, "nothing valid to update"); continue; }

      const t = await tx.task.update({ where: { id: taskId }, data });
      updated.push(taskId);
      if (data.dueDate) tasksToSync.push(syncPayload(t));
      await linkSources(taskId, sourceIds, "updated");
    } else if (action.type === "complete") {
      const t = await tx.task.update({
        where: { id: taskId },
        data: { status: "done", completedAt: now, schedulerStatus: "done" },
      });
      completed.push(taskId);
      activeIds.delete(taskId);
      if (t.googleEventId) tasksToSync.push(syncPayload(t));
      await linkSources(taskId, sourceIds, "completed");
    } else if (action.type === "cancel") {
      const t = await tx.task.update({
        where: { id: taskId },
        data: { status: "cancelled", schedulerStatus: "done" },
      });
      cancelled.push(taskId);
      activeIds.delete(taskId);
      if (t.googleEventId) tasksToSync.push(syncPayload(t));
      await linkSources(taskId, sourceIds, "cancelled");
    }
  }

  return { created, updated, completed, cancelled, skipped, tasksToSync };
}
