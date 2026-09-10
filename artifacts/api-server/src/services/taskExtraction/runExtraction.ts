import { prisma } from "@workspace/db-prisma";
import { logger } from "../../lib/logger";
import { syncTaskToCalendar } from "../googleCalendar";
import { callGeminiExtraction } from "./geminiPrompt";
import { reconcileTaskActions } from "./reconcileTasks";
import { reconcileKnowledgeActions } from "./reconcileKnowledge";
import { advanceCursor } from "./cursor";
import { checkAndAutoEndConversation } from "./autoEnd";
import { emptyExtractionResult, type ExtractionResult, type TaskToSync } from "./types";

/**
 * Runs extraction immediately for a conversation, bypassing the debounce.
 * Used by the manual "extract now" API endpoint and by the debounce itself.
 *
 * Returns counts for tasks and knowledge created/updated so callers can surface
 * them in API responses.
 */
export async function runExtraction(conversationId: string): Promise<ExtractionResult> {
  logger.info({ conversationId }, "extraction: started");
  
  const result = emptyExtractionResult();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    logger.warn({ conversationId }, "extraction: skipped (no API key)");
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
    
    // The userId for calendar sync should be the owner of the contact (the user who owns this contact)
    // This ensures calendar events are created in the correct user's calendar
    const userId = conversation.contact.ownerId;
    
    if (!userId) {
      logger.warn({ conversationId, contactId: conversation.contactId }, "extraction: no userId found for calendar sync, skipping");
      return result;
    }
    
    logger.info({ 
      conversationId, 
      userId, 
      contactId: conversation.contactId,
      contactOwnerId: conversation.contact.ownerId,
      contactIsService: conversation.contact.isService 
    }, "extraction: determining userId for calendar sync");

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
      await advanceCursor(prisma, conversationId, deltaMessages);
      return result;
    }

    // ------------------------------------------------------------------
    // 5. Reconcile inside a single transaction
    // ------------------------------------------------------------------
    let tasksToSync: TaskToSync[] = [];

    await prisma.$transaction(async (tx) => {
      const taskOutcome = await reconcileTaskActions(tx, {
        taskActions,
        conversationId,
        contactId: conversation.contactId,
        contactName: conversation.contact.name,
        contactBusiness: conversation.contact.business,
        deltaMessages,
      });
      result.created = taskOutcome.created;
      result.updated = taskOutcome.updated;
      result.completed = taskOutcome.completed;
      result.cancelled = taskOutcome.cancelled;
      tasksToSync = taskOutcome.tasksToSync;

      const knowledgeOutcome = await reconcileKnowledgeActions(tx, {
        knowledgeActions,
        contactId: conversation.contactId,
        deltaMessages,
      });
      result.knowledgeUpserted = knowledgeOutcome.knowledgeUpserted;
      result.knowledgeInvalidated = knowledgeOutcome.knowledgeInvalidated;

      // Advance cursor inside the same transaction
      await advanceCursor(tx, conversationId, deltaMessages);
    }, { timeout: 30_000 });

    // Sync tasks to Google Calendar (non-blocking, after transaction)
    logger.info({ 
      conversationId, 
      tasksToSyncCount: tasksToSync.length,
      userId 
    }, "extraction: syncing tasks to Google Calendar");
    
    for (const taskToSync of tasksToSync) {
      logger.info({ 
        taskId: taskToSync.id, 
        taskTitle: taskToSync.title,
        hasDueDate: !!taskToSync.dueDate,
        userId 
      }, "extraction: syncing individual task to calendar");
      
      syncTaskToCalendar({ ...taskToSync, userId }).catch((err) => {
        logger.error({ err, taskId: taskToSync.id }, "extraction: failed to sync task to calendar");
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

    logger.info({ 
      conversationId,
      created: result.created.length,
      updated: result.updated.length,
      completed: result.completed.length,
      cancelled: result.cancelled.length,
      knowledgeUpserted: result.knowledgeUpserted.length,
      knowledgeInvalidated: result.knowledgeInvalidated.length,
    }, "extraction: completed successfully");

    return result;
  } catch (err) {
    // Extraction is best-effort — log and leave the cursor unmoved so the
    // next debounce cycle retries with the same delta.
    logger.error({ err, conversationId }, "extraction: failed");
    return result;
  }
}
