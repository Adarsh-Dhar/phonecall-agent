import { CONFIDENCE_THRESHOLD } from "./config";
import type { TaskAction, TaskToSync, TxClient } from "./types";

/**
 * Applies task actions (create/update/complete/cancel) inside the caller's
 * transaction. Returns the id lists for the extraction result plus any tasks
 * that need a post-commit Google Calendar sync (has a dueDate set/changed).
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
  }
): Promise<{
  created: string[];
  updated: string[];
  completed: string[];
  cancelled: string[];
  tasksToSync: TaskToSync[];
}> {
  const { taskActions, conversationId, contactId, contactName, contactBusiness, deltaMessages } = params;

  const created: string[] = [];
  const updated: string[] = [];
  const completed: string[] = [];
  const cancelled: string[] = [];
  const tasksToSync: TaskToSync[] = [];

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
          contactId,
        },
      });
      created.push(task.id);

      // Collect for calendar sync if has due date
      if (action.dueDate) {
        tasksToSync.push({
          id: task.id,
          title: task.title,
          description: task.description,
          dueDate: task.dueDate,
          status: task.status,
          googleEventId: task.googleEventId,
          contact: { name: contactName, business: contactBusiness },
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
      updated.push(action.taskId);

      // Collect for calendar sync if has due date change
      if (action.dueDate) {
        tasksToSync.push({
          id: updatedTask.id,
          title: updatedTask.title,
          description: updatedTask.description,
          dueDate: updatedTask.dueDate,
          status: updatedTask.status,
          googleEventId: updatedTask.googleEventId,
          contact: { name: contactName, business: contactBusiness },
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
      const completedTask = await tx.task.update({
        where: { id: action.taskId },
        data: { status: "done", completedAt: new Date() },
      });
      completed.push(action.taskId);

      // Collect for calendar sync so the event picks up the "done" checkmark
      // (or gets removed, if it never had a due date). Only worth a round
      // trip if there's actually a synced event to update.
      if (completedTask.googleEventId) {
        tasksToSync.push({
          id: completedTask.id,
          title: completedTask.title,
          description: completedTask.description,
          dueDate: completedTask.dueDate,
          status: completedTask.status,
          googleEventId: completedTask.googleEventId,
          contact: { name: contactName, business: contactBusiness },
        });
      }

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
      const cancelledTask = await tx.task.update({
        where: { id: action.taskId },
        data: { status: "cancelled" },
      });
      cancelled.push(action.taskId);

      // Collect for calendar sync so a cancelled task's event gets removed
      // instead of sitting on the calendar forever. Only relevant if it was
      // ever actually synced.
      if (cancelledTask.googleEventId) {
        tasksToSync.push({
          id: cancelledTask.id,
          title: cancelledTask.title,
          description: cancelledTask.description,
          dueDate: cancelledTask.dueDate,
          status: cancelledTask.status,
          googleEventId: cancelledTask.googleEventId,
          contact: { name: contactName, business: contactBusiness },
        });
      }

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

  return { created, updated, completed, cancelled, tasksToSync };
}
