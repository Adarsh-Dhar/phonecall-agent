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
 * - Upserts to ContactKnowledge if knowledgeKey exists
 * - Resolves live query if call is in progress
 * - Creates callback task and reopens original task if call has ended
 */
export async function handleQueryAnswered(
  query: { id: string; question: string; knowledgeKey?: string | null; knowledgeCategory?: string | null; contactId: string; conversationId: string; callId?: string | null },
  answer: string
): Promise<void> {
  // Upsert to ContactKnowledge using the stored knowledgeKey and knowledgeCategory
  if (query.knowledgeKey && query.knowledgeCategory) {
    await prisma.contactKnowledge.upsert({
      where: {
        contactId_key: {
          contactId: query.contactId,
          key: query.knowledgeKey,
        },
      },
      create: {
        contactId: query.contactId,
        key: query.knowledgeKey,
        value: answer,
        category: query.knowledgeCategory,
        confidence: 1.0,
        status: "active",
      },
      update: {
        value: answer,
        category: query.knowledgeCategory,
        confidence: 1.0,
        status: "active",
        updatedAt: new Date(),
      },
    });

    logger.info(
      {
        questionId: query.id,
        contactId: query.contactId,
        knowledgeKey: query.knowledgeKey,
        knowledgeCategory: query.knowledgeCategory,
      },
      "questions/answer: upserted to ContactKnowledge"
    );
  } else {
    logger.warn(
      { questionId: query.id, contactId: query.contactId },
      "questions/answer: missing knowledgeKey or knowledgeCategory, skipping ContactKnowledge upsert"
    );
  }

  // If this is a live call query, try to resolve it to the in-progress call
  if (query.callId) {
    if (resolveLiveQuery(query.id, answer)) {
      return;
    }

    // Call already ended - create callback task and reopen original task if applicable
    const call = await prisma.call.findUnique({ where: { id: query.callId } });
    if (call?.taskId && call.status !== "in-progress") {
      await prisma.task.update({
        where: { id: call.taskId },
        data: {
          status: "open",
          callTriggeredAt: null,
          schedulerStatus: "pending",
          nextAttemptAt: new Date(),
          callAttempts: 0,
        },
      });
    }

    await prisma.task.create({
      data: {
        title: `Call back with answer: ${query.question}`,
        description: `Answer from user: ${answer}`,
        status: "open",
        priority: "high",
        dueDate: new Date(),
        source: "escalation",
        parentTaskId: call?.taskId ?? null,
        conversationId: query.conversationId,
        contactId: query.contactId,
        kind: "call",
      },
    });
  }
}

const router: IRouter = Router();

// Knowledge gap questions router (isKnowledgeGap: true)
const questionsRouter = makeQueryLikeRouter({
  basePath: "questions",
  isKnowledgeGap: true,
  resourceName: "question",
  onAnswered: handleQueryAnswered,
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
