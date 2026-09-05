import { Router, type IRouter } from "express";
import { prisma } from "@workspace/db-prisma";
import { scheduleExtraction } from "./taskExtraction";
import { sourcesInclude, contactCardSelect } from "../lib/prismaSelects";
import { asyncHandler } from "../lib/asyncHandler";
import { logger } from "../lib/logger";



export interface QueryLikeOptions {
  basePath: string; // "queries" | "questions"
  isKnowledgeGap: boolean;
  onAnswered?: (query: any, answer: string) => Promise<void>; // ContactKnowledge upsert, only for questions
  resourceName?: string; // "query" | "question" - for error messages
}

/**
 * Creates a parameterized router for query-like resources (queries vs questions).
 * This eliminates ~250 lines of duplication between queries.ts and questions.ts.
 */
export function makeQueryLikeRouter(opts: QueryLikeOptions): IRouter {
  const router: IRouter = Router();
  const resourceName = opts.resourceName || opts.basePath.slice(0, -1); // "queries" -> "query"
  const resourceCapitalized = resourceName.charAt(0).toUpperCase() + resourceName.slice(1);

  // ---------------------------------------------------------------------------
  // GET /conversations/:id/{basePath}
  // {resourceCapitalized}s for a single conversation thread, filterable by ?status=
  // ---------------------------------------------------------------------------
  router.get(
    `/conversations/:id/${opts.basePath}`,
    asyncHandler(async (req, res) => {
      const { id } = req.params;
      const { status } = req.query;

      // Verify conversation belongs to user
      const conversation = await prisma.conversation.findFirst({
        where: { id: String(id), contact: { userId: req.userId! } },
      });
      if (!conversation) {
        res.status(404).json({ error: "Conversation not found" });
        return;
      }

      const queries = await prisma.query.findMany({
        where: {
          conversationId: String(id),
          isKnowledgeGap: opts.isKnowledgeGap,
          ...(status ? { status: String(status) } : {}),
        },
        include: sourcesInclude,
        orderBy: { createdAt: "asc" },
      });

      res.json(queries);
    }, `Failed to fetch conversation ${resourceName}s`)
  );

  // ---------------------------------------------------------------------------
  // GET /contacts/:id/{basePath}
  // All {resourceCapitalized}s for a contact across all their conversation threads
  // ---------------------------------------------------------------------------
  router.get(
    `/contacts/:id/${opts.basePath}`,
    asyncHandler(async (req, res) => {
      const { id } = req.params;
      const { status } = req.query;

      // Verify contact belongs to user
      const contact = await prisma.contact.findFirst({
        where: { id: String(id), userId: req.userId! },
      });
      if (!contact) {
        res.status(404).json({ error: "Contact not found" });
        return;
      }

      const queries = await prisma.query.findMany({
        where: {
          contactId: String(id),
          isKnowledgeGap: opts.isKnowledgeGap,
          ...(status ? { status: String(status) } : {}),
        },
        include: sourcesInclude,
        orderBy: { createdAt: "desc" },
      });

      res.json(queries);
    }, `Failed to fetch contact ${resourceName}s`)
  );

  // ---------------------------------------------------------------------------
  // GET /{basePath}
  // Global {resourceName} inbox — cross-contact, filterable by ?status= / ?contactId=
  // ---------------------------------------------------------------------------
  router.get(
    `/${opts.basePath}`,
    asyncHandler(async (req, res) => {
      const { status, contactId } = req.query;

      const queries = await prisma.query.findMany({
        where: {
          contact: { userId: req.userId! },
          isKnowledgeGap: opts.isKnowledgeGap,
          ...(status ? { status: String(status) } : {}),
          ...(contactId ? { contactId: String(contactId) } : {}),
        },
        include: {
          ...sourcesInclude,
          contact: {
            select: contactCardSelect,
          },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json(queries);
    }, `Failed to fetch ${resourceName}s`)
  );

  // ---------------------------------------------------------------------------
  // POST /{basePath}
  // Manual {resourceName} creation — requires question, conversationId, contactId
  // status defaults to "pending"
  // ---------------------------------------------------------------------------
  router.post(
    `/${opts.basePath}`,
    asyncHandler(async (req, res) => {
      const { question, conversationId, contactId } = req.body;

      if (!question || !conversationId || !contactId) {
        res
          .status(400)
          .json({ error: `question, conversationId, and contactId are required` });
        return;
      }

      const query = await prisma.query.create({
        data: {
          question: String(question),
          status: "pending",
          conversationId: String(conversationId),
          contactId: String(contactId),
          isKnowledgeGap: opts.isKnowledgeGap,
        },
        include: sourcesInclude,
      });

      res.status(201).json(query);
    }, `Failed to create ${resourceName}`)
  );

  // ---------------------------------------------------------------------------
  // PATCH /{basePath}/:id/answer
  // Submit an answer: creates a transcript message, marks {resourceName} answered,
  // runs optional onAnswered callback (for ContactKnowledge upsert),
  // then triggers extraction.
  // Body: { answer: string }
  // ---------------------------------------------------------------------------
  router.patch(
    `/${opts.basePath}/:id/answer`,
    asyncHandler(async (req, res) => {
      const { id } = req.params;
      const { answer } = req.body;

      if (!answer) {
        res.status(400).json({ error: "answer is required" });
        return;
      }

      const query = await prisma.query.findUnique({ where: { id: String(id) } });
      if (!query) {
        res.status(404).json({ error: `${resourceCapitalized} not found` });
        return;
      }

      // Run the onAnswered callback (for ContactKnowledge upsert) - only for knowledge gap questions
      if (opts.onAnswered && query.isKnowledgeGap) {
        await opts.onAnswered(query, String(answer));
      }

      // Create a user message in the conversation so the answer appears in the
      // transcript and the extraction cursor picks it up on the next run.
      const message = await prisma.message.create({
        data: {
          role: "user",
          content: `Answering: "${query.question}" — ${String(answer)}`,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          conversationId: query.conversationId,
        },
      });

      const updated = await prisma.query.update({
        where: { id: String(id) },
        data: {
          answer: String(answer),
          status: "answered",
          answeredAt: new Date(),
          answerMessageId: message.id,
        },
        include: sourcesInclude,
      });

      await prisma.conversation.update({
        where: { id: query.conversationId },
        data: { updatedAt: new Date() },
      });

      // Re-run extraction so the agent sees the user's answer immediately
      scheduleExtraction(query.conversationId);

      res.json(updated);
    }, `Failed to answer ${resourceName}`)
  );

  // ---------------------------------------------------------------------------
  // PATCH /{basePath}/:id
  // Dismiss or edit a {resourceName} without answering it.
  // Body: { status?: "dismissed", question?: string }
  // ---------------------------------------------------------------------------
  router.patch(
    `/${opts.basePath}/:id`,
    asyncHandler(async (req, res) => {
      const { id } = req.params;
      const { status, question } = req.body;

      const existing = await prisma.query.findUnique({ where: { id: String(id) } });
      if (!existing) {
        res.status(404).json({ error: `${resourceCapitalized} not found` });
        return;
      }

      const updatedQuery = await prisma.query.update({
        where: { id: String(id) },
        data: {
          ...(status !== undefined ? { status: String(status) } : {}),
          ...(question !== undefined ? { question: String(question) } : {}),
        },
        include: sourcesInclude,
      });

      res.json(updatedQuery);
    }, `Failed to update ${resourceName}`)
  );

  return router;
}
