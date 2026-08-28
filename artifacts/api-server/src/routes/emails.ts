/**
 * Emails REST API
 *
 * POST /api/emails           — trigger an outbound email to a contact
 * GET  /api/emails/:id       — poll email status
 * GET  /api/conversations/:conversationId/emails — list emails for a conversation
 */

import { Router, type IRouter } from "express";
import multer from "multer";
import { prisma } from "@workspace/db-prisma";
import { sendOutboundEmail } from "../services/emailClient";
import { generateEmailReply, generateFollowUpEmailReply } from "../services/emailReply";
import { verifyEmailInboundSecret } from "../middlewares/verifyEmailInboundSecret";
import { scheduleExtraction } from "../services/taskExtraction";
import { logger } from "../lib/logger";
import { contactCardSelect, contactCardSelectWithEmail } from "../lib/prismaSelects";
import { getOrCreateActiveConversation } from "../services/conversations";

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
  const conversation = await getOrCreateActiveConversation(contactId, "Email with", contact.name || "Unknown");

  // Create an Email row in "initiated" state before we hit Twilio, so the
  // frontend gets a record immediately.
  const email = await prisma.email.create({
    data: {
      status: "initiated",
      direction: "outbound",
      conversationId: conversation.id,
      contactId,
      subject,
      from: process.env.SENDGRID_FROM_EMAIL || process.env.TWILIO_EMAIL_ADDRESS || "unknown@twilio.email",
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
// POST /api/emails/inbound — Twilio Inbound Parse webhook.
//
// Receives a reply from a contact, writes it to the transcript, and — same
// idea as the call pipeline — generates and sends an AI reply automatically.
//
// This is NOT signature-verified via X-Twilio-Signature (Inbound Parse
// doesn't sign requests that way); see verifyEmailInboundSecret.
// ---------------------------------------------------------------------------

router.post("/emails/inbound", verifyEmailInboundSecret, upload.none(), async (req, res) => {
  // Twilio Inbound Parse posts these as multipart/form-data fields.
  const fromRaw = req.body?.from as string | undefined; // e.g. "Jane Doe <jane@example.com>"
  const subject = (req.body?.subject as string | undefined) ?? "(no subject)";
  const text = req.body?.text as string | undefined;
  const html = req.body?.html as string | undefined;

  // Always ack quickly so Twilio doesn't retry/drop us — do the real work
  // after responding is tempting, but we need the DB writes to succeed
  // before telling them we're done, so just keep this handler fast instead.
  if (!fromRaw) {
    res.status(200).send("ignored: no From address");
    return;
  }

  const emailMatch = fromRaw.match(/<([^>]+)>/);
  const fromAddress = (emailMatch ? emailMatch[1] : fromRaw).trim().toLowerCase();

  try {
    let contact = await prisma.contact.findFirst({
      where: { email: fromAddress },
    });

    // Auto-create contact for unknown senders
    if (!contact) {
      logger.info({ fromAddress }, "emails/inbound: unknown sender, auto-creating contact");
      
      // Extract name from email address (part before @) for display
      const emailName = fromAddress.split('@')[0];
      const displayName = emailName
        .replace(/[._]/g, ' ')
        .replace(/\b\w/g, (l: string) => l.toUpperCase());
      
      contact = await prisma.contact.create({
        data: {
          name: displayName,
          business: 'Unknown',
          category: 'Other',
          phone: '0123456789',
          email: fromAddress,
          initials: displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
          color: '#a8a8a8',
          online: false,
        },
      });
      
      logger.info({ contactId: contact.id, fromAddress }, "emails/inbound: auto-created contact");
    }

    const inboundBody = text || html || "";

    const conversation = await getOrCreateActiveConversation(
      contact.id, 
      "Email with", 
      contact.name || "Unknown",
      `[Subject: ${subject}]\n${inboundBody}`
    );

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
    // failures there shouldn't cause Twilio to retry delivery of the
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

      // Check if there's already a pending query for this contact with the same knowledge gap
      // If so, suppress the holding reply to avoid repetitive emails
      let shouldSuppressReply = false;
      
      // If the reply indicates insufficient knowledge and has a knowledgeKey,
      // check for existing pending queries
      if (!reply.isEnoughKnowledge && reply.knowledgeKey) {
        const existingPendingQuery = await prisma.query.findFirst({
          where: {
            knowledgeKey: reply.knowledgeKey,
            status: "pending",
            contactId: contact.id,
          },
        });

        if (existingPendingQuery) {
          shouldSuppressReply = true;
          logger.info(
            { conversationId: conversation.id, contactId: contact.id, knowledgeKey: reply.knowledgeKey, existingQueryId: existingPendingQuery.id },
            "emails/inbound: suppressing holding reply (pending query with same knowledgeKey exists)"
          );
        }
      }

      // Skip sending the reply if we determined to suppress it
      if (shouldSuppressReply) {
        logger.info(
          { conversationId: conversation.id, contactId: contact.id },
          "emails/inbound: holding reply suppressed due to existing pending query"
        );
        return; // Exit early, don't send reply
      }

      if (!contact.email) return; // shouldn't happen, we matched on it above

      const outboundEmail = await prisma.email.create({
        data: {
          status: "initiated",
          direction: "outbound",
          conversationId: conversation.id,
          contactId: contact.id,
          subject: reply.subject,
          from: process.env.SENDGRID_FROM_EMAIL || process.env.TWILIO_EMAIL_ADDRESS || "unknown@twilio.email",
          to: contact.email,
          body: reply.body,
          isEnoughKnowledge: reply.isEnoughKnowledge,
        },
      });

      logger.info(
        { conversationId: conversation.id, contactId: contact.id, isEnoughKnowledge: reply.isEnoughKnowledge, emailId: outboundEmail.id },
        "emails/inbound: created auto-reply email"
      );

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

      // If the AI flagged that it needs escalation, create a Query for the user
      // Deduplicate by knowledgeKey to avoid duplicate queries for the same knowledge gap
      if (!reply.isEnoughKnowledge && reply.escalationQuestion) {
        // Check if a pending query with the same knowledgeKey already exists
        if (reply.knowledgeKey) {
          const existingQuery = await prisma.query.findFirst({
            where: {
              knowledgeKey: reply.knowledgeKey,
              status: "pending",
              contactId: contact.id,
            },
          });

          if (existingQuery) {
            logger.info(
              { conversationId: conversation.id, contactId: contact.id, knowledgeKey: reply.knowledgeKey, existingQueryId: existingQuery.id },
              "emails/inbound: skipping duplicate escalation query (pending query with same knowledgeKey exists)"
            );
          } else {
            await prisma.query.create({
              data: {
                question: reply.escalationQuestion,
                status: "pending",
                conversationId: conversation.id,
                contactId: contact.id,
                isKnowledgeGap: true,
                knowledgeKey: reply.knowledgeKey,
                knowledgeCategory: reply.knowledgeCategory,
              },
            });
            logger.info(
              { conversationId: conversation.id, contactId: contact.id, question: reply.escalationQuestion, isEnoughKnowledge: reply.isEnoughKnowledge, knowledgeKey: reply.knowledgeKey, knowledgeCategory: reply.knowledgeCategory },
              "emails/inbound: created escalation query"
            );
          }
        } else {
          // No knowledgeKey, create query without dedup check
          await prisma.query.create({
            data: {
              question: reply.escalationQuestion,
              status: "pending",
              conversationId: conversation.id,
              contactId: contact.id,
              isKnowledgeGap: true,
              knowledgeKey: reply.knowledgeKey,
              knowledgeCategory: reply.knowledgeCategory,
            },
          });
          logger.info(
            { conversationId: conversation.id, contactId: contact.id, question: reply.escalationQuestion, isEnoughKnowledge: reply.isEnoughKnowledge, knowledgeKey: reply.knowledgeKey, knowledgeCategory: reply.knowledgeCategory },
            "emails/inbound: created escalation query (no knowledgeKey)"
          );
        }
      }
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
// GET /api/emails — list all emails across all conversations
// ---------------------------------------------------------------------------

router.get("/emails", async (req, res) => {
  const emails = await prisma.email.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      contact: {
        select: contactCardSelect,
      },
    },
  });

  res.json(emails);
});

// ---------------------------------------------------------------------------
// GET /api/emails/:id — poll email status / details
// ---------------------------------------------------------------------------

router.get("/emails/:id", async (req, res) => {
  const { id } = req.params;

  const email = await prisma.email.findUnique({
    where: { id: String(id) },
    include: {
      contact: {
        select: contactCardSelectWithEmail,
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
    where: { conversationId: String(conversationId) },
    orderBy: { createdAt: "desc" },
    include: {
      contact: {
        select: contactCardSelect,
      },
    },
  });

  res.json(emails);
});

export default router;
