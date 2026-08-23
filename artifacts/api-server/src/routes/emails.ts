/**
 * Emails REST API
 *
 * POST /api/emails           — trigger an outbound email to a contact
 * GET  /api/emails/:id       — poll email status
 * GET  /api/conversations/:conversationId/emails — list emails for a conversation
 */

import { Router, type IRouter } from "express";
import multer from "multer";
import { prisma } from "../db-prisma";
import { sendOutboundEmail } from "../services/twilioClient";
import { generateEmailReply } from "../services/emailReply";
import { verifyEmailInboundSecret } from "../middlewares/verifyEmailInboundSecret";
import { scheduleExtraction } from "../services/taskExtraction";
import { logger } from "../lib/logger";

const router: IRouter = Router();
const upload = multer(); // Inbound Parse posts multipart/form-data with no file fields we need to keep

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

    // Write this into the conversation transcript, same as a call turn,
    // so it shows up in the thread and feeds task extraction.
    await prisma.message.create({
      data: {
        role: "assistant",
        content: body ?? html ?? subject,
        time: "Now",
        conversationId: conversation.id,
        emailId: email.id,
      },
    });
    scheduleExtraction(conversation.id);

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
// POST /api/emails/inbound — SendGrid/Twilio Inbound Parse webhook.
//
// Receives a reply from a contact, writes it to the transcript, and — same
// idea as the call pipeline — generates and sends an AI reply automatically.
//
// This is NOT signature-verified via X-Twilio-Signature (Inbound Parse
// doesn't sign requests that way); see verifyEmailInboundSecret.
// ---------------------------------------------------------------------------

router.post("/emails/inbound", verifyEmailInboundSecret, upload.none(), async (req, res) => {
  // SendGrid Inbound Parse posts these as multipart/form-data fields.
  const fromRaw = req.body?.from as string | undefined; // e.g. "Jane Doe <jane@example.com>"
  const subject = (req.body?.subject as string | undefined) ?? "(no subject)";
  const text = req.body?.text as string | undefined;
  const html = req.body?.html as string | undefined;

  // Always ack quickly so SendGrid doesn't retry/drop us — do the real work
  // after responding is tempting, but we need the DB writes to succeed
  // before telling them we're done, so just keep this handler fast instead.
  if (!fromRaw) {
    res.status(200).send("ignored: no From address");
    return;
  }

  const emailMatch = fromRaw.match(/<([^>]+)>/);
  const fromAddress = (emailMatch ? emailMatch[1] : fromRaw).trim().toLowerCase();

  try {
    const contact = await prisma.contact.findFirst({
      where: { email: { equals: fromAddress, mode: "insensitive" } },
    });

    if (!contact) {
      logger.warn({ fromAddress }, "emails/inbound: no contact matches sender, dropping");
      res.status(200).send("ignored: unknown sender");
      return;
    }

    let conversation = await prisma.conversation.findFirst({
      where: { contactId: contact.id },
      orderBy: { updatedAt: "desc" },
    });
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { contactId: contact.id, title: `Email with ${contact.name}` },
      });
    }

    const inboundBody = text || html || "";

    const inboundEmail = await prisma.email.create({
      data: {
        status: "received",
        direction: "inbound",
        conversationId: conversation.id,
        contactId: contact.id,
        subject,
        from: fromAddress,
        to: process.env.TWILIO_EMAIL_ADDRESS || "unknown@twilio.email",
        body: text,
        html,
        receivedAt: new Date(),
      },
    });

    await prisma.message.create({
      data: {
        role: "user",
        content: inboundBody,
        time: "Now",
        conversationId: conversation.id,
        emailId: inboundEmail.id,
      },
    });

    // Ack the webhook now — reply generation/sending happens after, and
    // failures there shouldn't cause SendGrid to retry delivery of the
    // original inbound email.
    res.status(200).send("ok");

    scheduleExtraction(conversation.id);

    // Auto-reply, same pattern as a completed call turn.
    try {
      const reply = await generateEmailReply({
        conversationId: conversation.id,
        contactId: contact.id,
        contactName: contact.name,
        incomingSubject: subject,
        incomingBody: inboundBody,
      });

      if (!contact.email) return; // shouldn't happen, we matched on it above

      const outboundEmail = await prisma.email.create({
        data: {
          status: "initiated",
          direction: "outbound",
          conversationId: conversation.id,
          contactId: contact.id,
          subject: reply.subject,
          from: process.env.TWILIO_EMAIL_ADDRESS || "unknown@twilio.email",
          to: contact.email,
          body: reply.body,
        },
      });

      const sendResult = await sendOutboundEmail({
        to: contact.email,
        subject: reply.subject,
        body: reply.body,
      });

      await prisma.email.update({
        where: { id: outboundEmail.id },
        data: { twilioSid: sendResult.sid, status: sendResult.status, sentAt: new Date() },
      });

      await prisma.message.create({
        data: {
          role: "assistant",
          content: reply.body,
          time: "Now",
          conversationId: conversation.id,
          emailId: outboundEmail.id,
        },
      });

      scheduleExtraction(conversation.id);
    } catch (replyErr) {
      // The inbound email is already safely recorded — a failed auto-reply
      // just means no reply went out, not data loss. Log and move on.
      logger.error({ err: replyErr, conversationId: conversation.id }, "emails/inbound: auto-reply failed");
    }
  } catch (error) {
    logger.error({ error }, "emails/inbound: failed to process inbound email");
    if (!res.headersSent) res.status(500).send("error");
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
