/**
 * Questions REST API — Knowledge Gap Questions
 *
 * This route handles queries that were created specifically because the AI agent
 * detected insufficient knowledge (isEnoughKnowledge: false). These are distinct
 * from general open-ended queries and have special handling:
 *
 * - When answered, the response is explicitly upserted into ContactKnowledge
 *   using the knowledgeKey/knowledgeCategory fields
 * - This ensures the fact lands in the knowledgebase deterministically rather
 *   than depending on the probabilistic extraction pass
 *
 * GET /questions                      — list all knowledge gap questions
 * GET /contacts/:id/questions         — list knowledge gap questions for a contact
 * GET /conversations/:id/questions    — list knowledge gap questions for a conversation
 * PATCH /questions/:id/answer          — answer a knowledge gap question (upserts to ContactKnowledge)
 * PATCH /questions/:id                 — dismiss/edit a knowledge gap question
 */

import { makeQueryLikeRouter } from "../services/queryLike";
import { prisma } from "@workspace/db-prisma";
import { logger } from "../lib/logger";

export default makeQueryLikeRouter({
  basePath: "questions",
  isKnowledgeGap: true,
  resourceName: "question",
  onAnswered: async (query, answer) => {
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
  },
});
