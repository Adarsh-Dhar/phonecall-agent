/**
 * Questions REST API — Handles both knowledge gap questions and general queries
 *
 * This route handles all queries raised during conversations:
 * - Knowledge gap questions (isKnowledgeGap: true) have special handling where
 *   answers are upserted into ContactKnowledge using knowledgeKey/knowledgeCategory
 * - General queries (isKnowledgeGap: false) are open-ended questions without
 *   knowledge base integration
 *
 * The router handles both /questions/* and /queries/* paths for backward compatibility.
 *
 * GET /questions /queries             — list all queries (filtered by type via path)
 * GET /contacts/:id/questions /queries    — list queries for a contact
 * GET /conversations/:id/questions /queries — list queries for a conversation
 * POST /questions /queries            — create a query
 * PATCH /questions/:id/answer /queries/:id/answer — answer a query
 * PATCH /questions/:id /queries/:id   — dismiss/edit a query
 */

import { Router, type IRouter } from "express";
import { makeQueryLikeRouter } from "../services/queryLike";
import { prisma } from "@workspace/db-prisma";
import { logger } from "../lib/logger";
import { resolveLiveQuery } from "../services/liveEscalation";

/**
 * Exported for testing: handles the logic after a query is answered
 * - Resolves live query if call is in progress
 * - Re-opens original task once with answer attached
 * - Creates callback task only when call had no task
 * - No longer directly upserts to ContactKnowledge; extraction reads the transcript message instead
 */
export async function handleQueryAnswered(
  query: { id: string; question: string; knowledgeKey?: string | null; knowledgeCategory?: string | null; contactId: string; conversationId: string; callId?: string | null },
  answer: string
): Promise<void> {
  // If this is a live call query, try to resolve it to the in-progress call
  if (query.callId) {
    if (resolveLiveQuery(query.id, answer)) {
      return;
    }

    // Call already ended - re-open original task once with answer attached
    const call = await prisma.call.findUnique({ where: { id: query.callId } });
    if (call?.taskId && call.status !== "in-progress") {
      const task = await prisma.task.findUnique({ where: { id: call.taskId }, select: { description: true } });
      await prisma.task.update({
        where: { id: call.taskId },
        data: {
          status: "open",
          callTriggeredAt: null,
          schedulerStatus: "pending",
          nextAttemptAt: new Date(),
          callAttempts: 0,
          description: (task?.description || "") + `\n\nAnswer from user: ${answer}`,
        },
      });
    }

    // Create callback task only when call had no task
    if (!call?.taskId) {
      await prisma.task.create({
        data: {
          title: `Call back with answer: ${query.question}`,
          description: `Answer from user: ${answer}`,
          status: "open",
          priority: "high",
          dueDate: new Date(),
          source: "escalation",
          conversationId: query.conversationId,
          contactId: query.contactId,
          kind: "call",
        },
      });
    }
  }
}

/**
 * Exported for testing: handles the logic after a query is dismissed
 * - Records the dismissal
 * - Ends the conversation if nothing else is open
 * - Re-runs extraction
 */
export async function handleQueryDismissed(
  query: { id: string; conversationId: string; contactId: string }
): Promise<void> {
  logger.info({ questionId: query.id }, "questions/dismiss: recording dismissal");

  // End the conversation if nothing else is open
  const conversation = await prisma.conversation.findUnique({
    where: { id: query.conversationId },
    include: {
      calls: {
        where: { status: "in-progress" },
      },
    },
  });

  if (conversation && conversation.calls.length === 0) {
    await prisma.conversation.update({
      where: { id: query.conversationId },
      data: { status: "ended" },
    });
    logger.info({ conversationId: query.conversationId }, "questions/dismiss: ended conversation");
  }

  // Re-run extraction to process the dismissal
  const { scheduleExtraction } = await import("../services/taskExtraction");
  scheduleExtraction(query.conversationId);
}

const router: IRouter = Router();

// Knowledge gap questions router (isKnowledgeGap: true)
const questionsRouter = makeQueryLikeRouter({
  basePath: "questions",
  isKnowledgeGap: true,
  resourceName: "question",
  onAnswered: handleQueryAnswered,
  onDismissed: handleQueryDismissed,
});

// General queries router (isKnowledgeGap: false) - for backward compatibility
const queriesRouter = makeQueryLikeRouter({
  basePath: "queries",
  isKnowledgeGap: false,
});

// Mount both routers
router.use(questionsRouter);
router.use(queriesRouter);

export default router;
