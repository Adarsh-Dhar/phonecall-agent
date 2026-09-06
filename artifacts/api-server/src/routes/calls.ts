/**
 * Calls REST API
 *
 * GET  /api/calls                               — list all calls
 * GET  /api/calls/:id                           — poll call status
 * GET  /api/conversations/:conversationId/calls — list calls for a conversation
 * POST /api/calls/dial                          — initiate a real call to a service account
 * POST /api/calls/:id/accept                     — accept an incoming call (service only)
 * POST /api/calls/:id/decline                    — decline an incoming call (service only)
 *
 * Calls themselves are created and completed by the browser voice transport
 * (services/voiceStreamBrowser.ts) when a "Test Call in Browser" session
 * starts/ends — there's no separate call-origination endpoint since there's
 * no telephony carrier to dial out through.
 */

import { Router, type IRouter } from "express";
import { prisma } from "@workspace/db-prisma";
import { contactCardSelect, contactCardSelectWithPhone } from "../lib/prismaSelects";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../lib/authMiddleware";
import { isOnline, sendToAccount } from "../services/presence";
import { logger } from "../lib/logger";
import type { Request } from "express";
import type { JWTPayload } from "../lib/jwt";

declare module 'express' {
  interface Request {
    userId?: string;
    user?: JWTPayload;
  }
}

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// GET /api/calls — list all calls across all conversations
// ---------------------------------------------------------------------------

router.get("/calls", requireAuth, async (req, res) => {
  const calls = await prisma.call.findMany({
    where: { contact: { ownerId: req.userId!, isService: true } },
    orderBy: { createdAt: "desc" },
    include: { contact: { select: contactCardSelect } },
  });
  res.json(calls);
});

// ---------------------------------------------------------------------------
// GET /api/calls/:id — poll call status / details
// ---------------------------------------------------------------------------

router.get("/calls/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const call = await prisma.call.findFirst({
    where: { id: String(id), contact: { ownerId: req.userId!, isService: true } },
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
  // Verify the conversation belongs to this user
  const conversation = await prisma.conversation.findFirst({
    where: { id: String(conversationId), contact: { ownerId: req.userId!, isService: true } },
  });
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  const calls = await prisma.call.findMany({
    where: { conversationId: String(conversationId) },
    orderBy: { createdAt: "desc" },
    include: { contact: { select: contactCardSelect } },
  });
  res.json(calls);
});

// ---------------------------------------------------------------------------
// POST /api/calls/dial — initiate a real call to a service account
// ---------------------------------------------------------------------------

router.post("/calls/dial", requireAuth, asyncHandler(async (req, res) => {
  const { contactId, taskId } = req.body;

  // Load the mirror contact account
  const contact = await prisma.account.findFirst({
    where: { 
      id: String(contactId), 
      ownerId: req.userId!, 
      isService: true 
    },
    select: { linkedAccountId: true, name: true },
  });

  if (!contact) {
    res.status(404).json({ error: "Contact not found" });
    return;
  }

  if (!contact.linkedAccountId) {
    res.status(400).json({ error: "This contact isn't a real, callable account yet" });
    return;
  }

  // Get or create conversation for this contact
  let conversation = await prisma.conversation.findFirst({
    where: { contactId: String(contactId) },
    select: { id: true },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        contactId: String(contactId),
        title: `Chat with ${contact.name}`,
      },
    });
  }

  // Check if the real service account is online
  const online = isOnline(contact.linkedAccountId);

  if (!online) {
    // Create a missed call record
    const call = await prisma.call.create({
      data: {
        status: "missed",
        contactId: String(contactId),
        calleeAccountId: contact.linkedAccountId,
        conversationId: conversation.id,
        from: "agent",
        to: contact.linkedAccountId,
      },
    });

    logger.info({ contactId, calleeAccountId: contact.linkedAccountId }, "Call missed - service offline");
    res.status(202).json({ callId: call.id, status: "missed" });
    return;
  }

  // Create a ringing call record
  const call = await prisma.call.create({
    data: {
      status: "ringing",
      ringingAt: new Date(),
      contactId: String(contactId),
      calleeAccountId: contact.linkedAccountId,
      conversationId: conversation.id,
      from: "agent",
      to: contact.linkedAccountId,
    },
  });

  // Get the personal user's name for the caller identity
  const caller = await prisma.account.findUnique({
    where: { id: req.userId! },
    select: { name: true },
  });

  // Send incoming call notification to the service account
  const taskContext = taskId ? await prisma.task.findUnique({
    where: { id: String(taskId) },
    select: { id: true, title: true, description: true },
  }) : null;

  sendToAccount(contact.linkedAccountId, {
    type: "incoming_call",
    callId: call.id,
    callerName: caller?.name || "Unknown",
    taskContext: taskContext ? {
      taskId: taskContext.id,
      title: taskContext.title,
      description: taskContext.description,
    } : null,
  });

  // Start a timeout to automatically mark as missed after ~25 seconds
  setTimeout(async () => {
    const updatedCall = await prisma.call.findUnique({
      where: { id: call.id },
      select: { status: true },
    });

    if (updatedCall?.status === "ringing") {
      await prisma.call.update({
        where: { id: call.id },
        data: { status: "missed" },
      });

      // Notify the personal user that the call was missed
      sendToAccount(req.userId!, {
        type: "call_status",
        callId: call.id,
        status: "missed",
      });

      logger.info({ callId: call.id }, "Call automatically marked as missed after timeout");
    }
  }, 25000);

  logger.info({ contactId, calleeAccountId: contact.linkedAccountId }, "Call initiated - ringing");
  res.status(200).json({ callId: call.id, status: "ringing" });
}, "Failed to dial call"));

// ---------------------------------------------------------------------------
// POST /api/calls/:id/accept — accept an incoming call (service only)
// ---------------------------------------------------------------------------

router.post("/calls/:id/accept", requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const call = await prisma.call.findUnique({
    where: { id: String(id) },
    select: { calleeAccountId: true, status: true, conversationId: true },
  });

  if (!call) {
    res.status(404).json({ error: "Call not found" });
    return;
  }

  if (call.calleeAccountId !== req.userId!) {
    res.status(403).json({ error: "You can only accept calls directed at you" });
    return;
  }

  if (call.status !== "ringing") {
    res.status(400).json({ error: "Call is not in ringing state" });
    return;
  }

  await prisma.call.update({
    where: { id: String(id) },
    data: {
      status: "in-progress",
      acceptedAt: new Date(),
    },
  });

  // Notify the personal user that the call was accepted
  const conversation = await prisma.conversation.findUnique({
    where: { id: call.conversationId },
    select: { contact: { select: { ownerId: true } } },
  });

  if (conversation?.contact?.ownerId) {
    sendToAccount(conversation.contact.ownerId, {
      type: "call_status",
      callId: String(id),
      status: "in-progress",
    });
  }

  logger.info({ callId: id }, "Call accepted");
  res.json({ status: "in-progress" });
}, "Failed to accept call"));

// ---------------------------------------------------------------------------
// POST /api/calls/:id/decline — decline an incoming call (service only)
// ---------------------------------------------------------------------------

router.post("/calls/:id/decline", requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const call = await prisma.call.findUnique({
    where: { id: String(id) },
    select: { calleeAccountId: true, status: true, conversationId: true },
  });

  if (!call) {
    res.status(404).json({ error: "Call not found" });
    return;
  }

  if (call.calleeAccountId !== req.userId!) {
    res.status(403).json({ error: "You can only decline calls directed at you" });
    return;
  }

  if (call.status !== "ringing") {
    res.status(400).json({ error: "Call is not in ringing state" });
    return;
  }

  await prisma.call.update({
    where: { id: String(id) },
    data: { status: "declined" },
  });

  // Notify the personal user that the call was declined
  const conversation = await prisma.conversation.findUnique({
    where: { id: call.conversationId },
    select: { contact: { select: { ownerId: true } } },
  });

  if (conversation?.contact?.ownerId) {
    sendToAccount(conversation.contact.ownerId, {
      type: "call_status",
      callId: String(id),
      status: "declined",
    });
  }

  logger.info({ callId: id }, "Call declined");
  res.json({ status: "declined" });
}, "Failed to decline call"));

export default router;
