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
    contactBusiness: string;
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
      await tx.task.update({
        where: { id: action.taskId },
        data: { status: "done", completedAt: new Date() },
      });
      completed.push(action.taskId);

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
      cancelled.push(action.taskId);

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
