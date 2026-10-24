import { logger } from "../../lib/logger";
import { ACTION_CONFIDENCE_THRESHOLD } from "./config";
import { parseModelDueDate } from "./validate";
import type { SkippedAction, TaskAction, TaskToSync, TxClient } from "./types";
import { createOpenLoopFromTask, resolveOpenLoopsByTaskId } from "../memory";
import {
  normalizeKind, allowsDateOnly, sanitizeMeta, localAt, statusOnCreate,
  firstFireAt, syncsToCalendar, type TaskKind
} from "../taskKinds";

export { parseModelDueDate } from "./validate";

const ACTIVE_STATUSES = ["suggested", "open", "in_progress", "waiting_user"];
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
    relationshipId?: string; // Phase 4: For OpenLoop integration
    ownerTz: string;
    agentMode?: boolean;
  }
): Promise<{
  created: string[];
  updated: string[];
  completed: string[];
  cancelled: string[];
  skipped: SkippedAction[];
  tasksToSync: TaskToSync[];
}> {
  const { taskActions, conversationId, contactId, contactName, contactBusiness, deltaMessages, relationshipId, ownerTz, agentMode } = params;
  const now = params.now ?? new Date();

  const created: string[] = [];
  const updated: string[] = [];
  const completed: string[] = [];
  const cancelled: string[] = [];
  const skipped: SkippedAction[] = [];
  const tasksToSync: TaskToSync[] = [];

  const deltaIds = new Set(deltaMessages.map((m) => m.id));
  const activeRows = await tx.task.findMany({
    where: {
      status: { in: ACTIVE_STATUSES },
      OR: [{ conversationId }, { contactId, kind: { in: ["appointment", "bring"] } }],
    },
    select: { id: true, title: true, kind: true, parentTaskId: true, dueDate: true },
  });
  const activeIds = new Set(activeRows.map((t) => t.id));
  const dedupeKey = (kind: string, title: string, parent?: string | null) => `${kind}|${norm(title)}|${parent ?? ""}`;
  const activeKeys = new Set(activeRows.map((t) => dedupeKey(t.kind, t.title, t.parentTaskId)));
  const kindById = new Map(activeRows.map((t) => [t.id, t.kind]));
  const refMap = new Map<string, string>();

  const skip = (a: TaskAction, reason: SkippedAction["reason"]) => {
    skipped.push({ kind: "task", type: a.type, ref: a.taskId, reason });
    logger.warn({ conversationId, type: a.type, taskId: a.taskId, reason }, "reconcileTasks: action skipped");
  };

  const syncPayload = (t: {
    id: string; title: string; description: string | null; dueDate: Date | null;
    status: string; googleEventId: string | null; kind: string; meta: Record<string, unknown> | null;
  }): TaskToSync => ({
    id: t.id, title: t.title, description: t.description, dueDate: t.dueDate,
    status: t.status, googleEventId: t.googleEventId, kind: t.kind, meta: t.meta,
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

  // Process appointments first so children can resolve parentRef
  const order = (a: TaskAction) => (a.type === "create" && a.kind === "appointment" ? 0 : 1);
  const ordered = [...taskActions].sort((x, y) => order(x) - order(y));

  for (const action of ordered) {
    const sourceIds = (action.sourceMessageIds ?? []).filter((id) => deltaIds.has(id));

    // ---------------- create ----------------
    if (action.type === "create") {
      const title = action.title?.trim();
      if (!title) { skip(action, "empty title"); continue; }

      const kind = normalizeKind(action.kind);
      const parentId = action.parentTaskId && activeIds.has(action.parentTaskId)
        ? action.parentTaskId
        : action.parentRef ? refMap.get(action.parentRef) : undefined;
      if (kind === "bring" && !parentId) { skip(action, "bring without a parent appointment"); continue; }
      if (activeKeys.has(dedupeKey(kind, title, parentId))) { skip(action, "duplicate of an active task"); continue; }

      const due = action.dueDate
        ? parseModelDueDate(action.dueDate, now, { allowDateOnly: allowsDateOnly(kind), tz: ownerTz })
        : null;
      const dateOnly = !!action.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(action.dueDate.trim());
      const meta = { ...(action.meta ?? {}), ...(dateOnly ? { allDay: true } : {}) };

      // For bring without a dueDate, inherit from parent
      let finalDue = due;
      if (kind === "bring" && !finalDue && parentId) {
        const parent = await tx.task.findUnique({ where: { id: parentId }, select: { dueDate: true } });
        finalDue = parent?.dueDate ?? null;
      }

      if (action.dueDate && !finalDue) {
        logger.warn({ conversationId, dueDate: action.dueDate }, "reconcileTasks: invalid dueDate dropped on create");
      }

      const status = statusOnCreate(kind, action.confidence ?? 1, { hasDate: !!finalDue, agentMode });
      const task = await tx.task.create({
        data: {
          title,
          description: action.description,
          status,
          priority: action.priority ?? "normal",
          dueDate: finalDue,
          confidence: action.confidence ?? 1,
          source: "agent",
          conversationId,
          contactId,
          kind,
          parentTaskId: parentId ?? null,
          meta: Object.keys(meta).length ? meta : undefined,
          nextAttemptAt: firstFireAt(kind, finalDue, ownerTz, now),
          callAttempts: 0,
          schedulerStatus: "pending",
        },
      });
      if (action.ref) refMap.set(action.ref, task.id);
      kindById.set(task.id, kind);
      activeIds.add(task.id);
      activeKeys.add(dedupeKey(kind, title, parentId));
      created.push(task.id);
      if (finalDue && syncsToCalendar(kind)) tasksToSync.push(syncPayload({ ...task, kind, meta: Object.keys(meta).length ? meta : null }));
      await linkSources(task.id, sourceIds, "created");

      // Phase 4: Create an OpenLoop for this task if relationshipId is provided
      if (relationshipId) {
        try {
          await createOpenLoopFromTask({
            relationshipId,
            taskId: task.id,
            title,
            dueDate: finalDue || undefined,
          });
        } catch (err) {
          logger.error({ err, taskId: task.id }, "reconcileTasks: failed to create open loop for task");
        }
      }

      continue;
    }

    // ------------- update / complete / cancel -------------
    const taskId = action.taskId;
    if (!taskId || !activeIds.has(taskId)) { skip(action, "taskId is not an active task in this conversation"); continue; }
    if ((action.confidence ?? 0) < ACTION_CONFIDENCE_THRESHOLD) { skip(action, "confidence below action threshold"); continue; }
    if (sourceIds.length === 0) { skip(action, "no cited message from the new messages"); continue; }

    if (action.type === "update") {
      const row = await tx.task.findUnique({ where: { id: taskId }, select: { kind: true, dueDate: true } });
      const kind = normalizeKind(row?.kind);
      const data: Record<string, unknown> = {
        ...(action.title ? { title: action.title } : {}),
        ...(action.description !== undefined ? { description: action.description } : {}),
        ...(action.priority ? { priority: action.priority } : {}),
      };

      if (action.dueDate !== undefined) {
        const due = parseModelDueDate(action.dueDate, now, { allowDateOnly: allowsDateOnly(kind), tz: ownerTz });
        if (due) {
          data.dueDate = due;
          data.nextAttemptAt = firstFireAt(kind, due, ownerTz, now);
          data.callAttempts = 0;
          data.schedulerStatus = "pending";
        } else {
          logger.warn({ conversationId, taskId, dueDate: action.dueDate }, "reconcileTasks: invalid dueDate dropped on update");
        }
      }
      if (Object.keys(data).length === 0) { skip(action, "nothing valid to update"); continue; }

      const t = await tx.task.update({ where: { id: taskId }, data });
      updated.push(taskId);
      if (data.dueDate && syncsToCalendar(kind)) tasksToSync.push(syncPayload(t));

      // If this is an appointment and the due date changed, shift its children
      if (data.dueDate && kind === "appointment" && row?.dueDate) {
        const delta = +data.dueDate - +row.dueDate;
        const kids = await tx.task.findMany({ where: { parentTaskId: taskId, status: { in: ACTIVE_STATUSES } } });
        for (const k of kids) if (k.dueDate) {
          const nd = new Date(+k.dueDate + delta);
          await tx.task.update({ where: { id: k.id }, data: {
            dueDate: nd,
            nextAttemptAt: firstFireAt(normalizeKind(k.kind), nd, ownerTz, now),
            callAttempts: 0,
            schedulerStatus: "pending",
          } });
        }
      }

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

      // Phase 4: Resolve open loops associated with this task
      if (relationshipId) {
        try {
          await resolveOpenLoopsByTaskId(taskId);
        } catch (err) {
          logger.error({ err, taskId }, "reconcileTasks: failed to resolve open loops for task");
        }
      }
    } else if (action.type === "cancel") {
      const row = await tx.task.findUnique({ where: { id: taskId }, select: { kind: true } });
      const kind = normalizeKind(row?.kind);
      const t = await tx.task.update({
        where: { id: taskId },
        data: { status: "cancelled", schedulerStatus: "done" },
      });
      cancelled.push(taskId);
      activeIds.delete(taskId);
      if (t.googleEventId && syncsToCalendar(kind)) tasksToSync.push(syncPayload(t));

      // If this is an appointment, cancel its active children too
      if (kind === "appointment") {
        await tx.task.updateMany({
          where: { parentTaskId: taskId, status: { in: ACTIVE_STATUSES } },
          data: { status: "cancelled", schedulerStatus: "done" },
        });
      }

      await linkSources(taskId, sourceIds, "cancelled");

      // Phase 4: Resolve open loops associated with this task
      if (relationshipId) {
        try {
          await resolveOpenLoopsByTaskId(taskId);
        } catch (err) {
          logger.error({ err, taskId }, "reconcileTasks: failed to resolve open loops for task");
        }
      }
    }
  }

  return { created, updated, completed, cancelled, skipped, tasksToSync };
}
