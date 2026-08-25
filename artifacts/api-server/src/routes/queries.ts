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
// GET /conversations/:id/queries
// Queries for a single conversation thread, filterable by ?status=
// ---------------------------------------------------------------------------
router.get("/conversations/:id/queries", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    const queries = await prisma.query.findMany({
      where: {
        conversationId: id,
        ...(status ? { status: String(status) } : {}),
      },
      include: queryInclude,
      orderBy: { createdAt: "asc" },
    });

    res.json(queries);
  } catch {
    res.status(500).json({ error: "Failed to fetch conversation queries" });
  }
});

// ---------------------------------------------------------------------------
// GET /contacts/:id/queries
// All queries for a contact across all their conversation threads
// ---------------------------------------------------------------------------
router.get("/contacts/:id/queries", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    const queries = await prisma.query.findMany({
      where: {
        contactId: id,
        ...(status ? { status: String(status) } : {}),
      },
      include: queryInclude,
      orderBy: { createdAt: "desc" },
    });

    res.json(queries);
  } catch {
    res.status(500).json({ error: "Failed to fetch contact queries" });
  }
});

// ---------------------------------------------------------------------------
// GET /queries
// Global query inbox — cross-contact, filterable by ?status= / ?contactId=
// ---------------------------------------------------------------------------
router.get("/queries", async (req, res) => {
  try {
    const { status, contactId } = req.query;

    const queries = await prisma.query.findMany({
      where: {
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

    res.json(queries);
  } catch {
    res.status(500).json({ error: "Failed to fetch queries" });
  }
});

// ---------------------------------------------------------------------------
// POST /queries
// Manual query creation — requires question, conversationId, contactId
// status defaults to "pending"
// ---------------------------------------------------------------------------
router.post("/queries", async (req, res) => {
  try {
    const { question, conversationId, contactId } = req.body;

    if (!question || !conversationId || !contactId) {
      res
        .status(400)
        .json({ error: "question, conversationId, and contactId are required" });
      return;
    }

    const query = await prisma.query.create({
      data: {
        question,
        status: "pending",
        conversationId,
        contactId,
      },
      include: queryInclude,
    });

    res.status(201).json(query);
  } catch {
    res.status(500).json({ error: "Failed to create query" });
  }
});

// ---------------------------------------------------------------------------
// PATCH /queries/:id/answer
// Submit an answer: creates a transcript message, marks query answered,
// then triggers extraction so the agent can act on the new information.
// Body: { answer: string }
// ---------------------------------------------------------------------------
router.patch("/queries/:id/answer", async (req, res) => {
  try {
    const { id } = req.params;
    const { answer } = req.body;

    if (!answer) {
      res.status(400).json({ error: "answer is required" });
      return;
    }

    const query = await prisma.query.findUnique({ where: { id } });
    if (!query) {
      res.status(404).json({ error: "Query not found" });
      return;
    }

    // Create a user message in the conversation so the answer appears in the
    // transcript and the extraction cursor picks it up on the next run.
    const message = await prisma.message.create({
      data: {
        role: "user",
        content: `Answering: "${query.question}" — ${answer}`,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        conversationId: query.conversationId,
      },
    });

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
      where: { id: query.conversationId },
      data: { updatedAt: new Date() },
    });

    // Re-run extraction so the agent sees the user's answer immediately
    scheduleExtraction(query.conversationId);

    // If the contact has an email, send a follow-up email with the answer
    const contact = await prisma.contact.findUnique({
      where: { id: query.contactId },
    });

    if (contact?.email) {
      try {
        // Find the original inbound email on this conversation
        const lastInboundEmail = await prisma.email.findFirst({
          where: {
            conversationId: query.conversationId,
            direction: "inbound",
          },
          orderBy: { createdAt: "desc" },
        });

        if (lastInboundEmail) {
          const followUp = await generateFollowUpEmailReply({
            conversationId: query.conversationId,
            contactId: query.contactId,
            contactName: contact.name,
            originalSubject: lastInboundEmail.subject,
          });

          const outboundEmail = await prisma.email.create({
            data: {
              status: "initiated",
              direction: "outbound",
              conversationId: query.conversationId,
              contactId: query.contactId,
              subject: followUp.subject,
              from: process.env.SENDGRID_FROM_EMAIL || process.env.TWILIO_EMAIL_ADDRESS || "unknown@twilio.email",
              to: contact.email,
              body: followUp.body,
              isEnoughKnowledge: followUp.isEnoughKnowledge,
            },
          });

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
              conversationId: query.conversationId,
              emailId: outboundEmail.id,
            },
          });

          scheduleExtraction(query.conversationId);

          logger.info(
            { queryId: id, contactId: query.contactId, emailId: outboundEmail.id },
            "queries/answer: sent follow-up email"
          );
        }
      } catch (emailErr) {
        // The answer is already saved — a failed follow-up email just means
        // no reply went out, not data loss. Log and move on.
        logger.error({ err: emailErr, queryId: id }, "queries/answer: follow-up email failed");
      }
    }

    res.json(updated);
  } catch {
    res.status(500).json({ error: "Failed to answer query" });
  }
});

// ---------------------------------------------------------------------------
// PATCH /queries/:id
// Dismiss or edit a query without answering it.
// Body: { status?: "dismissed", question?: string }
// ---------------------------------------------------------------------------
router.patch("/queries/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, question } = req.body;

    const existing = await prisma.query.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Query not found" });
      return;
    }

    const query = await prisma.query.update({
      where: { id },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(question !== undefined ? { question } : {}),
      },
      include: queryInclude,
    });

    res.json(query);
  } catch {
    res.status(500).json({ error: "Failed to update query" });
  }
});

export default router;
