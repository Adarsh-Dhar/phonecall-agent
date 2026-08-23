/**
 * Emails REST API
 *
 * POST /api/emails           — trigger an outbound email to a contact
 * GET  /api/emails/:id       — poll email status
 * GET  /api/conversations/:conversationId/emails — list emails for a conversation
 */

import { Router, type IRouter } from "express";
import { prisma } from "@workspace/db-prisma";
import { sendOutboundEmail } from "../services/twilioClient";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// POST /api/emails — initiate an outbound email to a contact
// ---------------------------------------------------------------------------

router.post("/emails", async (req, res) => {
  const { contactId, subject, body, html, fromName } = req.body as {
    contactId?: string;
    subject?: string;
    body?: string;
    html?: string;
    fromName?: string;
  };

  if (!contactId || typeof contactId !== "string") {
    res.status(400).json({ error: "contactId is required" });
    return;
  }

  if (!subject || typeof subject !== "string") {
    res.status(400).json({ error: "subject is required" });
    return;
  }

  if (!body && !html) {
    res.status(400).json({ error: "Either body (plain text) or html (HTML) must be provided" });
    return;
  }

  // Look up the contact
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
  });

  if (!contact) {
    res.status(404).json({ error: "Contact not found" });
    return;
  }

  if (!contact.email) {
    res.status(422).json({
      error:
        "Contact does not have an email address. " +
        "Update Contact.email to a valid email address before sending an email.",
    });
    return;
  }

  // Get or create the active conversation for this contact
  let conversation = await prisma.conversation.findFirst({
    where: { contactId },
    orderBy: { updatedAt: "desc" },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { contactId, title: `Email with ${contact.name}` },
    });
  }

  // Create an Email row in "initiated" state before we hit Twilio, so the
  // frontend gets a record immediately.
  const email = await prisma.email.create({
    data: {
      status: "initiated",
      direction: "outbound",
      conversationId: conversation.id,
      contactId,
      subject,
      from: process.env.TWILIO_EMAIL_ADDRESS || "unknown@twilio.email",
      to: contact.email,
      body,
      html,
    },
  });

  try {
    const result = await sendOutboundEmail({
      to: contact.email,
      subject,
      body,
      html,
      fromName,
    });

    // Persist the Twilio SID so subsequent status callbacks can find this row
    const updated = await prisma.email.update({
      where: { id: email.id },
      data: { twilioSid: result.sid, status: result.status, sentAt: new Date() },
    });

    res.status(201).json(updated);
  } catch (err) {
    logger.error({ err, emailId: email.id }, "emails: sendOutboundEmail failed");

    // Mark the email as failed so the UI doesn't show it as stuck
    const failed = await prisma.email.update({
      where: { id: email.id },
      data: { status: "failed" },
    });

    res.status(502).json({
      error:
        err instanceof Error ? err.message : "Failed to send email via Twilio",
      email: failed,
    });
  }
});

// ---------------------------------------------------------------------------
// GET /api/emails/:id — poll email status / details
// ---------------------------------------------------------------------------

router.get("/emails/:id", async (req, res) => {
  const { id } = req.params;

  const email = await prisma.email.findUnique({
    where: { id },
    include: {
      contact: {
        select: { id: true, name: true, business: true, initials: true, color: true, email: true },
      },
    },
  });

  if (!email) {
    res.status(404).json({ error: "Email not found" });
    return;
  }

  res.json(email);
});

// ---------------------------------------------------------------------------
// GET /api/conversations/:conversationId/emails — list emails for a conversation
// ---------------------------------------------------------------------------

router.get("/conversations/:conversationId/emails", async (req, res) => {
  const { conversationId } = req.params;

  const emails = await prisma.email.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    include: {
      contact: {
        select: { id: true, name: true, business: true, initials: true, color: true },
      },
    },
  });

  res.json(emails);
});

export default router;
