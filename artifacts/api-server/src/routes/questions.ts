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

import { Router, type IRouter } from "express";
import { prisma } from "@workspace/db-prisma";
import { scheduleExtraction } from "../services/taskExtraction";
import { generateFollowUpEmailReply } from "../services/emailReply";
import { sendOutboundEmail } from "../services/twilioClient";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// Shared query shape — include source messages for jump-to-context links
// ---------------------------------------------------------------------------

const queryInclude = {
  sources: {
    include: {
      message: { select: { id: true, role: true, time: true, content: true } },
    },
    orderBy: { id: "asc" as const },
  },
} as const;

// ---------------------------------------------------------------------------
// GET /conversations/:id/questions
// Knowledge gap questions for a single conversation thread, filterable by ?status=
// ---------------------------------------------------------------------------
router.get("/conversations/:id/questions", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    const questions = await prisma.query.findMany({
      where: {
        conversationId: id,
        isKnowledgeGap: true,
        ...(status ? { status: String(status) } : {}),
      },
      include: queryInclude,
      orderBy: { createdAt: "asc" },
    });

    res.json(questions);
  } catch {
    res.status(500).json({ error: "Failed to fetch conversation questions" });
  }
});

// ---------------------------------------------------------------------------
// GET /contacts/:id/questions
// All knowledge gap questions for a contact across all their conversation threads
// ---------------------------------------------------------------------------
router.get("/contacts/:id/questions", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    const questions = await prisma.query.findMany({
      where: {
        contactId: id,
        isKnowledgeGap: true,
        ...(status ? { status: String(status) } : {}),
      },
      include: queryInclude,
      orderBy: { createdAt: "desc" },
    });

    res.json(questions);
  } catch {
    res.status(500).json({ error: "Failed to fetch contact questions" });
  }
});

// ---------------------------------------------------------------------------
// GET /questions
// Global knowledge gap question inbox — cross-contact, filterable by ?status= / ?contactId=
// ---------------------------------------------------------------------------
router.get("/questions", async (req, res) => {
  try {
    const { status, contactId } = req.query;

    const questions = await prisma.query.findMany({
      where: {
        isKnowledgeGap: true,
        ...(status ? { status: String(status) } : {}),
        ...(contactId ? { contactId: String(contactId) } : {}),
      },
      include: {
        ...queryInclude,
        contact: {
          select: {
            id: true,
            name: true,
            business: true,
            initials: true,
            color: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(questions);
  } catch {
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

// ---------------------------------------------------------------------------
// PATCH /questions/:id/answer
// Answer a knowledge gap question: creates a transcript message, marks question answered,
// upserts to ContactKnowledge using the stored knowledgeKey/knowledgeCategory,
// then triggers extraction and sends a follow-up email if applicable.
// Body: { answer: string }
// ---------------------------------------------------------------------------
router.patch("/questions/:id/answer", async (req, res) => {
  try {
    const { id } = req.params;
    const { answer } = req.body;

    if (!answer) {
      res.status(400).json({ error: "answer is required" });
      return;
    }

    const question = await prisma.query.findUnique({ where: { id } });
    if (!question) {
      res.status(404).json({ error: "Question not found" });
      return;
    }

    // Verify this is actually a knowledge gap question
    if (!question.isKnowledgeGap) {
      res.status(400).json({ 
        error: "This query is not a knowledge gap question. Use /queries/:id/answer instead.",
        queryId: id 
      });
      return;
    }

    // Create a user message in the conversation so the answer appears in the
    // transcript and the extraction cursor picks it up on the next run.
    const message = await prisma.message.create({
      data: {
        role: "user",
        content: `Answering: "${question.question}" — ${answer}`,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        conversationId: question.conversationId,
      },
    });

    // Upsert to ContactKnowledge using the stored knowledgeKey and knowledgeCategory
    if (question.knowledgeKey && question.knowledgeCategory) {
      await prisma.contactKnowledge.upsert({
        where: {
          contactId_key: {
            contactId: question.contactId,
            key: question.knowledgeKey,
          },
        },
        create: {
          contactId: question.contactId,
          key: question.knowledgeKey,
          value: answer,
          category: question.knowledgeCategory,
          confidence: 1.0,
          status: "active",
        },
        update: {
          value: answer,
          category: question.knowledgeCategory,
          confidence: 1.0,
          status: "active",
          updatedAt: new Date(),
        },
      });

      logger.info(
        { 
          questionId: id, 
          contactId: question.contactId, 
          knowledgeKey: question.knowledgeKey, 
          knowledgeCategory: question.knowledgeCategory 
        },
        "questions/answer: upserted to ContactKnowledge"
      );
    } else {
      logger.warn(
        { questionId: id, contactId: question.contactId },
        "questions/answer: missing knowledgeKey or knowledgeCategory, skipping ContactKnowledge upsert"
      );
    }

    const updated = await prisma.query.update({
      where: { id },
      data: {
        answer,
        status: "answered",
        answeredAt: new Date(),
        answerMessageId: message.id,
      },
      include: queryInclude,
    });

    await prisma.conversation.update({
      where: { id: question.conversationId },
      data: { updatedAt: new Date() },
    });

    // Re-run extraction so the agent sees the user's answer immediately
    scheduleExtraction(question.conversationId);

    // If the contact has an email, send a follow-up email with the answer
    const contact = await prisma.contact.findUnique({
      where: { id: question.contactId },
    });

    if (contact?.email) {
      try {
        // Find the original inbound email on this conversation
        const lastInboundEmail = await prisma.email.findFirst({
          where: {
            conversationId: question.conversationId,
            direction: "inbound",
          },
          orderBy: { createdAt: "desc" },
        });

        if (lastInboundEmail) {
          const followUp = await generateFollowUpEmailReply({
            conversationId: question.conversationId,
            contactId: question.contactId,
            contactName: contact.name,
            originalSubject: lastInboundEmail.subject,
          });

          const outboundEmail = await prisma.email.create({
            data: {
              status: "initiated",
              direction: "outbound",
              conversationId: question.conversationId,
              contactId: question.contactId,
              subject: followUp.subject,
              from: process.env.SENDGRID_FROM_EMAIL || process.env.TWILIO_EMAIL_ADDRESS || "unknown@twilio.email",
              to: contact.email,
              body: followUp.body,
              isEnoughKnowledge: followUp.isEnoughKnowledge,
            },
          });

          logger.info(
            { questionId: id, contactId: question.contactId, emailId: outboundEmail.id, isEnoughKnowledge: followUp.isEnoughKnowledge },
            "questions/answer: created follow-up email"
          );

          const sendResult = await sendOutboundEmail({
            to: contact.email,
            subject: followUp.subject,
            body: followUp.body,
          });

          await prisma.email.update({
            where: { id: outboundEmail.id },
            data: { twilioSid: sendResult.sid, status: sendResult.status, sentAt: new Date() },
          });

          await prisma.message.create({
            data: {
              role: "assistant",
              content: followUp.body,
              time: "Now",
              conversationId: question.conversationId,
              emailId: outboundEmail.id,
            },
          });

          scheduleExtraction(question.conversationId);

          logger.info(
            { questionId: id, contactId: question.contactId, emailId: outboundEmail.id, isEnoughKnowledge: followUp.isEnoughKnowledge },
            "questions/answer: sent follow-up email"
          );
        }
      } catch (emailErr) {
        // The answer is already saved — a failed follow-up email just means
        // no reply went out, not data loss. Log and move on.
        logger.error({ err: emailErr, questionId: id }, "questions/answer: follow-up email failed");
      }
    }

    res.json(updated);
  } catch {
    res.status(500).json({ error: "Failed to answer question" });
  }
});

// ---------------------------------------------------------------------------
// PATCH /questions/:id
// Dismiss or edit a knowledge gap question without answering it.
// Body: { status?: "dismissed", question?: string }
// ---------------------------------------------------------------------------
router.patch("/questions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, question } = req.body;

    const existing = await prisma.query.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Question not found" });
      return;
    }

    // Verify this is actually a knowledge gap question
    if (!existing.isKnowledgeGap) {
      res.status(400).json({ 
        error: "This query is not a knowledge gap question. Use /queries/:id instead.",
        queryId: id 
      });
      return;
    }

    const updatedQuestion = await prisma.query.update({
      where: { id },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(question !== undefined ? { question } : {}),
      },
      include: queryInclude,
    });

    res.json(updatedQuestion);
  } catch {
    res.status(500).json({ error: "Failed to update question" });
  }
});

export default router;
