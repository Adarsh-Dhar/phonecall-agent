/**
 * Calls REST API
 *
 * POST /api/calls           — trigger an outbound call to a contact
 * GET  /api/calls/:id       — poll call status
 * GET  /api/conversations/:conversationId/calls — list calls for a conversation
 */

import { Router, type IRouter } from "express";
import { prisma } from "../db-prisma";
import { placeOutboundCall } from "../services/twilioClient";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// POST /api/calls — initiate an outbound call to a contact
// ---------------------------------------------------------------------------

router.post("/calls", async (req, res) => {
  const { contactId } = req.body as { contactId?: string };

  if (!contactId || typeof contactId !== "string") {
    res.status(400).json({ error: "contactId is required" });
    return;
  }

  const publicBaseUrl = process.env.PUBLIC_BASE_URL;
  if (!publicBaseUrl) {
    res.status(503).json({
      error: "PUBLIC_BASE_URL is not configured — cannot place call",
    });
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

  if (!contact.phone || contact.phone === "0123456789") {
    res.status(422).json({
      error:
        "Contact does not have a real E.164 phone number. " +
        "Update Contact.phone to a value like +14155551234 before placing a call.",
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
      data: { contactId, title: `Call with ${contact.name}` },
    });
  }

  // Create a Call row in "initiated" state before we hit Twilio, so the
  // frontend gets a record immediately.
  const call = await prisma.call.create({
    data: {
      status: "initiated",
      direction: "outbound",
      conversationId: conversation.id,
      contactId,
    },
  });

  // Twilio webhook URLs — Twilio will POST to these over the public internet
  const voiceUrl = `${publicBaseUrl}/api/twilio/voice`;
  const statusCallbackUrl = `${publicBaseUrl}/api/twilio/status?callId=${call.id}`;

  try {
    const result = await placeOutboundCall({
      to: contact.phone,
      voiceUrl,
      statusCallbackUrl,
    });

    // Persist the Twilio SID so subsequent status callbacks can find this row
    const updated = await prisma.call.update({
      where: { id: call.id },
      data: { twilioSid: result.sid, status: result.status },
    });

    res.status(201).json(updated);
  } catch (err) {
    logger.error({ err, callId: call.id }, "calls: placeOutboundCall failed");

    // Mark the call as failed so the UI doesn't show it as stuck
    const failed = await prisma.call.update({
      where: { id: call.id },
      data: { status: "failed" },
    });

    res.status(502).json({
      error:
        err instanceof Error ? err.message : "Failed to place call via Twilio",
      call: failed,
    });
  }
});

// ---------------------------------------------------------------------------
// GET /api/calls/:id — poll call status / details
// ---------------------------------------------------------------------------

router.get("/calls/:id", async (req, res) => {
  const { id } = req.params;

  const call = await prisma.call.findUnique({
    where: { id },
    include: {
      contact: {
        select: { id: true, name: true, business: true, initials: true, color: true, phone: true },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, role: true, content: true, time: true, createdAt: true },
      },
    },
  });

  if (!call) {
    res.status(404).json({ error: "Call not found" });
    return;
  }

  res.json(call);
});

// ---------------------------------------------------------------------------
// GET /api/conversations/:conversationId/calls — list calls for a conversation
// ---------------------------------------------------------------------------

router.get("/conversations/:conversationId/calls", async (req, res) => {
  const { conversationId } = req.params;

  const calls = await prisma.call.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    include: {
      contact: {
        select: { id: true, name: true, business: true, initials: true, color: true },
      },
    },
  });

  res.json(calls);
});

export default router;
