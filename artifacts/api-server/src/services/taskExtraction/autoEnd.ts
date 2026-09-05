import { prisma } from "@workspace/db-prisma";
import { logger } from "../../lib/logger";
import { endConversation } from "../conversations";

/**
 * Check if a conversation should be auto-ended:
 * - All tasks are completed (done or cancelled)
 * - No pending queries exist for this conversation
 * - Conversation is currently active
 * - At least one task or query was ever created (avoid auto-ending empty conversations)
 */
export async function checkAndAutoEndConversation(conversationId: string): Promise<void> {
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
