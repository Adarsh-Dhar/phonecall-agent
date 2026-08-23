/**
 * Twilio voice webhook routes
 *
 * These routes are called by Twilio over the public internet and are protected
 * by the verifyTwilioSignature middleware (mounted in routes/index.ts).
 *
 * POST /api/twilio/voice    — called when an outbound call is answered;
 *                             returns TwiML that opens a Media Stream WebSocket
 * POST /api/twilio/incoming — called when an inbound call arrives
 * POST /api/twilio/status   — call lifecycle events (ringing, completed, etc.)
 */

import { Router, type IRouter } from "express";
import { prisma } from "../db-prisma";
import { scheduleExtraction } from "../services/taskExtraction";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build TwiML that connects the call to a Twilio Media Stream WebSocket.
 * The WS endpoint is served by the same process (index.ts upgrades /media-stream).
 */
function buildStreamTwiml(publicBaseUrl: string): string {
  // Strip the https:// scheme to form the wss:// URL
  const wsHost = publicBaseUrl.replace(/^https?:\/\//, "");
  const streamUrl = `wss://${wsHost}/media-stream`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${streamUrl}" />
  </Connect>
</Response>`;
}

// ---------------------------------------------------------------------------
// POST /api/twilio/voice — outbound call answered
// ---------------------------------------------------------------------------

router.post("/twilio/voice", (req, res) => {
  const publicBaseUrl = process.env.PUBLIC_BASE_URL;

  if (!publicBaseUrl) {
    logger.error("twilio/voice: PUBLIC_BASE_URL is not set");
    // Return minimal TwiML to say something rather than dead air
    res.type("text/xml").send(`<?xml version="1.0" encoding="UTF-8"?>
<Response><Say>Sorry, this service is not configured correctly.</Say></Response>`);
    return;
  }

  const twiml = buildStreamTwiml(publicBaseUrl);
  logger.info({ callSid: req.body?.CallSid }, "twilio/voice: answered, streaming");
  res.type("text/xml").send(twiml);
});

// ---------------------------------------------------------------------------
// POST /api/twilio/incoming — inbound call
// ---------------------------------------------------------------------------

router.post("/twilio/incoming", async (req, res) => {
  const publicBaseUrl = process.env.PUBLIC_BASE_URL;
  const from: string = (req.body?.From as string) ?? "";
  const callSid: string = (req.body?.CallSid as string) ?? "";

  logger.info({ from, callSid }, "twilio/incoming: inbound call received");

  if (!publicBaseUrl) {
    logger.error("twilio/incoming: PUBLIC_BASE_URL is not set");
    res.type("text/xml").send(`<?xml version="1.0" encoding="UTF-8"?>
<Response><Say>Sorry, this service is not configured correctly.</Say></Response>`);
    return;
  }

  // Try to match the caller to an existing contact by phone number
  const contact = await prisma.contact.findFirst({
    where: { phone: from },
    include: {
      conversations: { orderBy: { updatedAt: "desc" }, take: 1 },
    },
  });

  // Get or create a conversation for this caller
  let conversationId: string;
  let contactId: string;

  if (contact) {
    contactId = contact.id;
    const existingConv = contact.conversations[0];
    if (existingConv) {
      conversationId = existingConv.id;
    } else {
      const conv = await prisma.conversation.create({
        data: { contactId: contact.id, title: `Inbound call from ${from}` },
      });
      conversationId = conv.id;
    }
  } else {
    // Unknown caller — create a placeholder contact
    const newContact = await prisma.contact.create({
      data: {
        name: from,
        business: "Unknown caller",
        category: "Other",
        phone: from,
        initials: "??",
        color: "#b0b0b0",
      },
    });
    contactId = newContact.id;
    const conv = await prisma.conversation.create({
      data: { contactId: newContact.id, title: `Inbound call from ${from}` },
    });
    conversationId = conv.id;
  }

  // Create the Call record
  await prisma.call.create({
    data: {
      twilioSid: callSid,
      status: "ringing",
      direction: "inbound",
      conversationId,
      contactId,
    },
  });

  const twiml = buildStreamTwiml(publicBaseUrl);
  res.type("text/xml").send(twiml);
});

// ---------------------------------------------------------------------------
// POST /api/twilio/status — call lifecycle events
// ---------------------------------------------------------------------------

/**
 * Twilio posts this with form params including:
 *   CallSid, CallStatus, CallDuration (on completion), Timestamp, etc.
 * Our own statusCallbackUrl includes ?callId=<our DB id> so we don't have
 * to look up by SID on every event.
 */
router.post("/twilio/status", async (req, res) => {
  // callId injected via query string when we placed the call
  const callId = req.query["callId"] as string | undefined;
  const twilioSid: string = (req.body?.CallSid as string) ?? "";
  const twilioStatus: string = (req.body?.CallStatus as string) ?? "";
  const durationStr: string = (req.body?.CallDuration as string) ?? "";

  logger.info(
    { callId, twilioSid, twilioStatus, duration: durationStr },
    "twilio/status: lifecycle event"
  );

  // Normalise Twilio status → our DB status
  const STATUS_MAP: Record<string, string> = {
    queued: "initiated",
    initiated: "initiated",
    ringing: "ringing",
    "in-progress": "in_progress",
    completed: "completed",
    busy: "busy",
    failed: "failed",
    "no-answer": "no_answer",
    cancelled: "cancelled",
  };
  const dbStatus = STATUS_MAP[twilioStatus] ?? twilioStatus;

  // Locate the Call row — prefer our injected callId, fall back to SID
  let call = callId
    ? await prisma.call.findUnique({ where: { id: callId } })
    : await prisma.call.findUnique({ where: { twilioSid } });

  if (!call && twilioSid) {
    // Last-resort lookup by SID (handles inbound calls where we didn't inject callId)
    call = await prisma.call.findUnique({ where: { twilioSid } });
  }

  if (!call) {
    logger.warn({ callId, twilioSid }, "twilio/status: no matching Call row found");
    res.sendStatus(204);
    return;
  }

  const isTerminal = ["completed", "busy", "failed", "no_answer", "cancelled"].includes(dbStatus);

  const updated = await prisma.call.update({
    where: { id: call.id },
    data: {
      status: dbStatus,
      ...(durationStr ? { duration: parseInt(durationStr, 10) } : {}),
      ...(dbStatus === "in_progress" && !call.startedAt ? { startedAt: new Date() } : {}),
      ...(isTerminal ? { endedAt: new Date() } : {}),
    },
  });

  // When the call ends, fire task extraction so the transcript turns get mined
  if (isTerminal && updated.conversationId) {
    logger.info(
      { callId: call.id, conversationId: updated.conversationId },
      "twilio/status: call ended — scheduling extraction"
    );
    scheduleExtraction(updated.conversationId);
  }

  res.sendStatus(204);
});

export default router;
