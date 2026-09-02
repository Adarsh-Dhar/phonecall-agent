/**
 * Calls REST API
 *
 * POST /api/calls                              — trigger an outbound call to a contact
 * GET  /api/calls                               — list all calls
 * GET  /api/calls/:id                           — poll call status
 * GET  /api/conversations/:conversationId/calls — list calls for a conversation
 * GET  /api/calls/passthru                      — Exotel Passthru Applet webhook (call lifecycle)
 */

import { Router, type IRouter } from "express";
import { prisma } from "@workspace/db-prisma";
import { placeOutboundCall } from "../services/voiceClient";
import { verifyCallPassthruSecret } from "../middlewares/verifyCallPassthruSecret";
import { analyzeCallForEscalation } from "../services/callAnalysis";
import { scheduleExtraction } from "../services/taskExtraction";
import { logger } from "../lib/logger";
import { contactCardSelect, contactCardSelectWithPhone } from "../lib/prismaSelects";
import { getOrCreateActiveConversation } from "../services/conversations";

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

  const contact = await prisma.contact.findUnique({ where: { id: contactId } });
  if (!contact) {
    res.status(404).json({ error: "Contact not found" });
    return;
  }

  if (!contact.phone) {
    res.status(422).json({ error: "Contact does not have a phone number on file." });
    return;
  }

  const conversation = await getOrCreateActiveConversation(contactId, "Call with", contact.name || "Unknown");

  const call = await prisma.call.create({
    data: {
      status: "initiated",
      direction: "outbound",
      conversationId: conversation.id,
      contactId,
      from: process.env.EXOTEL_CALLER_ID || "unknown",
      to: contact.phone,
    },
  });

  try {
    const placed = await placeOutboundCall(contact.phone);

    const updated = await prisma.call.update({
      where: { id: call.id },
      data: { exotelCallSid: placed.sid, status: placed.status },
    });

    res.status(201).json(updated);
  } catch (err) {
    logger.error({ err, callId: call.id }, "calls: placeOutboundCall failed");

    const failed = await prisma.call.update({
      where: { id: call.id },
      data: { status: "failed" },
    });

    res.status(502).json({
      error: err instanceof Error ? err.message : "Failed to place call via Exotel",
      call: failed,
    });
  }
});

// ---------------------------------------------------------------------------
// GET /api/calls/passthru — Exotel Passthru Applet webhook.
//
// Fires after the Voicebot Applet stream ends, with call lifecycle metadata.
// Not signature-verified (see verifyCallPassthruSecret), same pattern as the
// old Inbound Parse email webhook.
// ---------------------------------------------------------------------------

router.get("/calls/passthru", verifyCallPassthruSecret, async (req, res) => {
  const callSid = req.query.CallSid as string | undefined;
  const streamStatus = req.query["Stream[Status]"] as string | undefined;
  const duration = req.query["Stream[Duration]"] as string | undefined;
  const recordingUrl = req.query["Stream[RecordingUrl]"] as string | undefined;
  const disconnectedBy = req.query["Stream[DisconnectedBy]"] as string | undefined;

  if (!callSid) {
    res.status(200).send("ignored: no CallSid");
    return;
  }

  try {
    const call = await prisma.call.update({
      where: { exotelCallSid: callSid },
      data: {
        status: streamStatus === "failed" ? "failed" : "completed",
        durationSec: duration ? Number(duration) : null,
        recordingUrl: recordingUrl || null,
        disconnectedBy: disconnectedBy || null,
        endedAt: new Date(),
      },
    });

    res.status(200).send("ok");

    scheduleExtraction(call.conversationId);
    void analyzeCallForEscalation(call.id);
  } catch (err) {
    logger.error({ err, callSid }, "calls/passthru: failed to process call completion");
    if (!res.headersSent) res.status(500).send("error");
  }
});

// ---------------------------------------------------------------------------
// GET /api/calls — list all calls across all conversations
// ---------------------------------------------------------------------------

router.get("/calls", async (req, res) => {
  const calls = await prisma.call.findMany({
    orderBy: { createdAt: "desc" },
    include: { contact: { select: contactCardSelect } },
  });
  res.json(calls);
});

// ---------------------------------------------------------------------------
// GET /api/calls/:id — poll call status / details
// ---------------------------------------------------------------------------

router.get("/calls/:id", async (req, res) => {
  const { id } = req.params;
  const call = await prisma.call.findUnique({
    where: { id: String(id) },
    include: { contact: { select: contactCardSelectWithPhone } },
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
    where: { conversationId: String(conversationId) },
    orderBy: { createdAt: "desc" },
    include: { contact: { select: contactCardSelect } },
  });
  res.json(calls);
});

export default router;