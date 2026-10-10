import {
  ACTION_CONFIDENCE_THRESHOLD,
  CONFIDENCE_THRESHOLD,
  DUE_DATE_PAST_TOLERANCE_MS,
  MAX_DUE_DATE_HORIZON_DAYS,
} from "./config";
import type { SkippedAction, TaskAction, TaskToSync, TxClient } from "./types";

const ACTIVE_STATUSES = ["suggested", "open", "in_progress"];

/**
 * Validates a model-supplied dueDate before it can reach the scheduler or
 * Google Calendar. Returns a Date, or null when the value is unusable
 * (not parseable, no time of day, in the past, or implausibly far out).
 * Date-only strings are rejected: they parse as midnight UTC, i.e. an
 * invented time — the prompt forbids that, this enforces it.
 */
export function parseModelDueDate(value: unknown, now = new Date()): Date | null {
  if (typeof value !== "string" || !/\d{1,2}:\d{2}/.test(value)) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  if (d.getTime() < now.getTime() - DUE_DATE_PAST_TOLERANCE_MS) return null;
  if (d.getTime() > now.getTime() + MAX_DUE_DATE_HORIZON_DAYS * 86_400_000) return null;
  return d;
}

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  status: string;
  googleEventId: string | null;
};

function toSync(task: TaskRow, contactName: string, contactBusiness: string | null): TaskToSync {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    dueDate: task.dueDate,
    status: task.status,
    googleEventId: task.googleEventId,
    contact: { name: contactName, business: contactBusiness },
  };
}

async function linkSources(
  tx: TxClient,
  taskId: string,
  role: "created" | "updated" | "completed" | "cancelled",
  sourceIds: string[]
) {
  for (const messageId of sourceIds) {
    await tx.taskSourceMessage.upsert({
      where: { taskId_messageId_role: { taskId, messageId, role } },
      create: { taskId, messageId, role },
      update: {},
    });
  }
}

/**
 * Applies task actions (create/update/complete/cancel) inside the caller's
 * transaction. Returns the id lists for the extraction result plus any tasks
 * that need a post-commit Google Calendar sync.
 *
 * Guards — model output drives real actions (the scheduler auto-dials open
 * tasks, Calendar gets events, done/cancelled tasks disappear), so:
 *  - create: "open" only at/above CONFIDENCE_THRESHOLD, else "suggested".
 *    Only OPEN tasks are synced to Calendar here; a suggested task is synced
 *    by PATCH /tasks/:id when the user accepts it. The scheduler only claims
 *    open/in_progress tasks, so suggested tasks are never auto-dialed.
 *  - update / complete / cancel must target an ACTIVE task of THIS
 *    conversation (a hallucinated or foreign taskId is skipped, not applied).
 *  - complete / cancel need confidence >= ACTION_CONFIDENCE_THRESHOLD and at
 *    least one cited message from this batch; otherwise they are skipped.
 *  - an update's dueDate change needs the same confidence; below it the other
 *    fields still apply but the schedule is left alone.
 *  - every dueDate is validated by parseModelDueDate.
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
    /** Injectable for tests. */
    now?: Date;
  }
): Promise<{
  created: string[];
  updated: string[];
  completed: string[];
  cancelled: string[];
  tasksToSync: TaskToSync[];
  skipped: SkippedAction[];
}> {
  const { taskActions, conversationId, contactId, contactName, contactBusiness, deltaMessages } = params;
  const now = params.now ?? new Date();
  const deltaIds = new Set(deltaMessages.map((m) => m.id));

  const created: string[] = [];
  const updated: string[] = [];
  const completed: string[] = [];
  const cancelled: string[] = [];
  const tasksToSync: TaskToSync[] = [];
  const skipped: SkippedAction[] = [];

  for (const action of taskActions) {
    const sourceIds = (action.sourceMessageIds ?? []).filter((id) => deltaIds.has(id));

    if (action.type === "create") {
      if (!action.title || !action.title.trim()) continue;

      const dueDate = action.dueDate ? parseModelDueDate(action.dueDate, now) : null;
      if (action.dueDate && !dueDate) {
        skipped.push({ kind: "task", type: "create", reason: "invalid_due_date" });
      }
      const status = action.confidence >= CONFIDENCE_THRESHOLD ? "open" : "suggested";

      const task = await tx.task.create({
        data: {
          title: action.title.trim(),
          description: action.description,
          status,
          priority: action.priority ?? "normal",
          dueDate,
          confidence: action.confidence,
          source: "agent",
          conversationId,
          contactId,
          kind: action.kind ?? "call",
          nextAttemptAt: dueDate,
          callAttempts: 0,
          schedulerStatus: "pending",
        },
      });
      created.push(task.id);

      if (task.dueDate && task.status === "open") {
        tasksToSync.push(toSync(task, contactName, contactBusiness));
      }
      await linkSources(tx, task.id, "created", sourceIds);
      continue;
    }

    // Everything below targets an existing task.
    if (!action.taskId) continue;

    const target = await tx.task.findFirst({
      where: { id: action.taskId, conversationId, status: { in: ACTIVE_STATUSES } },
      select: { id: true },
    });
    if (!target) {
      skipped.push({ kind: "task", type: action.type, ref: action.taskId, reason: "unknown_task" });
      continue;
    }

    if (action.type === "update") {
      const confident = action.confidence >= ACTION_CONFIDENCE_THRESHOLD;
      const updateData: any = {
        ...(action.title?.trim() ? { title: action.title.trim() } : {}),
        ...(action.description !== undefined ? { description: action.description } : {}),
        ...(action.priority ? { priority: action.priority } : {}),
      };

      let rescheduled = false;
      if (action.dueDate !== undefined) {
        const dueDate = parseModelDueDate(action.dueDate, now);
        if (!dueDate) {
          skipped.push({ kind: "task", type: "update", ref: action.taskId, reason: "invalid_due_date" });
        } else if (!confident) {
          skipped.push({ kind: "task", type: "update", ref: action.taskId, reason: "low_confidence" });
        } else {
          updateData.dueDate = dueDate;
          updateData.nextAttemptAt = dueDate;
          updateData.callAttempts = 0;
          updateData.schedulerStatus = "pending";
          rescheduled = true;
        }
      }
      if (Object.keys(updateData).length === 0) continue;

      const task = await tx.task.update({ where: { id: action.taskId }, data: updateData });
      updated.push(action.taskId);

      // Only a schedule change on a task the user has accepted is worth a
      // Calendar round trip; suggested tasks are synced on acceptance.
      if (rescheduled && task.status !== "suggested") {
        tasksToSync.push(toSync(task, contactName, contactBusiness));
      }
      await linkSources(tx, action.taskId, "updated", sourceIds);
      continue;
    }

    // complete / cancel
    if (!(action.confidence >= ACTION_CONFIDENCE_THRESHOLD)) {
      skipped.push({ kind: "task", type: action.type, ref: action.taskId, reason: "low_confidence" });
      continue;
    }
    if (sourceIds.length === 0) {
      skipped.push({ kind: "task", type: action.type, ref: action.taskId, reason: "no_source_message" });
      continue;
    }

    if (action.type === "complete") {
      const task = await tx.task.update({
        where: { id: action.taskId },
        data: { status: "done", completedAt: now, schedulerStatus: "done" },
      });
      completed.push(action.taskId);
      // So the event picks up the "done" checkmark — only if it was ever synced.
      if (task.googleEventId) tasksToSync.push(toSync(task, contactName, contactBusiness));
      await linkSources(tx, action.taskId, "completed", sourceIds);
    } else if (action.type === "cancel") {
      const task = await tx.task.update({
        where: { id: action.taskId },
        data: { status: "cancelled", schedulerStatus: "done" },
      });
      cancelled.push(action.taskId);
      // So a cancelled task's event is removed — only if it was ever synced.
      if (task.googleEventId) tasksToSync.push(toSync(task, contactName, contactBusiness));
      await linkSources(tx, action.taskId, "cancelled", sourceIds);
    }
  }

  return { created, updated, completed, cancelled, tasksToSync, skipped };
}
