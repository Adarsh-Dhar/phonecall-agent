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

const router: IRouter = Router();

// A Call's `contact` relation is always the mirror row the *dialer* used to
// place it (owned by the caller, describing the callee) — the stored
// `direction` column defaults to "outbound" and is never overridden on
// creation, and `contact.name` only ever makes sense from the dialer's own
// point of view. This recomputes both relative to whoever is actually
// looking at the list, so the person who was called sees "inbound" with the
// caller's real name instead of their own name reflected back at them.
function toViewerCall<
  T extends { calleeAccountId: string | null; contact: { name: string; owner: { name: string } | null } }
>(call: T, viewerId: string) {
  const viewerIsCallee = call.calleeAccountId === viewerId;
  return {
    ...call,
    direction: viewerIsCallee ? "inbound" : "outbound",
    otherPartyName: viewerIsCallee ? (call.contact.owner?.name ?? "Unknown caller") : call.contact.name,
  };
}

// ---------------------------------------------------------------------------
// GET /api/calls — list all calls across all conversations
// ---------------------------------------------------------------------------

router.get("/calls", requireAuth, async (req, res) => {
  const calls = await prisma.call.findMany({
    where: {
      // Calls the viewer placed (owns the dialing contact) OR calls placed
      // to the viewer (they're the real callee) — previously only the first
      // half was queried, so a callee had no way to ever see an inbound call.
      OR: [
        { contact: { ownerId: req.userId!, isService: true } },
        { calleeAccountId: req.userId! },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: { contact: { select: { ...contactCardSelect, owner: { select: { name: true } } } } },
  });
  res.json(calls.map((call) => toViewerCall(call, req.userId!)));
});

// ---------------------------------------------------------------------------
// GET /api/calls/:id — poll call status / details
// ---------------------------------------------------------------------------

router.get("/calls/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const call = await prisma.call.findFirst({
    where: {
      id: String(id),
      OR: [
        { contact: { ownerId: req.userId!, isService: true } },
        { calleeAccountId: req.userId! },
      ],
    },
    include: { contact: { select: { ...contactCardSelectWithPhone, owner: { select: { name: true } } } } },
  });
  if (!call) {
    res.status(404).json({ error: "Call not found" });
    return;
  }
  res.json(toViewerCall(call, req.userId!));
});

// ---------------------------------------------------------------------------
// GET /api/conversations/:conversationId/calls — list calls for a conversation
// ---------------------------------------------------------------------------

router.get("/conversations/:conversationId/calls", requireAuth, async (req, res) => {
  const { conversationId } = req.params;
  // Verify the conversation belongs to this user (either as dialer contact owner or callee)
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: String(conversationId),
      OR: [
        { contact: { ownerId: req.userId!, isService: true } },
        { calls: { some: { calleeAccountId: req.userId! } } },
      ],
    },
  });
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  const calls = await prisma.call.findMany({
    where: { conversationId: String(conversationId) },
    orderBy: { createdAt: "desc" },
    include: { contact: { select: { ...contactCardSelect, owner: { select: { name: true } } } } },
  });
  res.json(calls.map((call) => toViewerCall(call, req.userId!)));
});

// ---------------------------------------------------------------------------
// POST /api/calls/dial — initiate a real call to a service account
// ---------------------------------------------------------------------------

router.post("/calls/dial", requireAuth, asyncHandler(async (req, res) => {
  const { contactId, taskId } = req.body;

  logger.info({ userId: req.userId, contactId, taskId }, "dial: received call request");

  // Get the current user's account to check if they're a service account
  const currentUser = await prisma.account.findUnique({
    where: { id: req.userId! },
    select: { isService: true, linkedAccountId: true },
  });

  let contact;
  let callerIsService = false;

  // Case 1: Personal user calling a service account (mirror contact they own)
  if (!currentUser?.isService) {
    contact = await prisma.account.findFirst({
      where: {
        id: String(contactId),
        ownerId: req.userId!,
        isService: true,
      },
      select: { linkedAccountId: true, name: true, ownerId: true },
    });
  }
  // Case 2: Service account calling through a contact they own
  else if (currentUser?.isService) {
    // The service account is calling using a contact they own
    // This contact should have a linkedAccountId pointing to the owner
    contact = await prisma.account.findFirst({
      where: {
        id: String(contactId),
        ownerId: req.userId!,
        isService: true,
      },
      select: { linkedAccountId: true, name: true, ownerId: true },
    });
    callerIsService = true;
  }

  logger.info({ userId: req.userId, contactId, contactFound: !!contact, contact, callerIsService, currentUser }, "dial: contact lookup result");

  if (!contact) {
    logger.warn({ userId: req.userId, contactId, currentUser }, "dial: contact not found - user may not own this contact");
    res.status(404).json({ error: "Contact not found or you don't have permission to call this contact" });
    return;
  }

  // Validate taskId belongs to this contact if provided
  if (taskId) {
    const task = await prisma.task.findUnique({
      where: { id: String(taskId) },
      select: { contactId: true },
    });
    if (!task || task.contactId !== String(contactId)) {
      res.status(400).json({ error: "Task does not belong to this contact" });
      return;
    }
  }

  // For service accounts calling, the callee is the linkedAccountId (the owner)
  // For personal users calling service accounts, the callee is the linkedAccountId (the service account)
  const calleeAccountId = contact.linkedAccountId;

  if (!calleeAccountId) {
    logger.warn({ userId: req.userId, contactId, contact }, "dial: no valid calleeAccountId found");
    res.status(400).json({ error: "This contact isn't linked to a callable account yet" });
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

  // Check if the callee is online
  const online = isOnline(calleeAccountId);

  if (!online) {
    // Create a missed call record
    const call = await prisma.call.create({
      data: {
        status: "missed",
        contactId: String(contactId),
        calleeAccountId: calleeAccountId,
        conversationId: conversation.id,
        from: "agent",
        to: calleeAccountId,
        taskId: taskId ? String(taskId) : null,
      },
    });

    logger.info({ contactId, calleeAccountId }, "Call missed - callee offline");
    res.status(202).json({ callId: call.id, status: "missed" });
    return;
  }

  // Create a ringing call record
  const call = await prisma.call.create({
    data: {
      status: "ringing",
      ringingAt: new Date(),
      contactId: String(contactId),
      calleeAccountId: calleeAccountId,
      conversationId: conversation.id,
      from: "agent",
      to: calleeAccountId,
      taskId: taskId ? String(taskId) : null,
    },
  });

  // Get the caller's name for the caller identity
  const caller = await prisma.account.findUnique({
    where: { id: req.userId! },
    select: { name: true },
  });

  // Send incoming call notification to the callee
  const taskContext = taskId ? await prisma.task.findUnique({
    where: { id: String(taskId) },
    select: { id: true, title: true, description: true },
  }) : null;

  logger.info(
    { callId: call.id, calleeAccountId, callerName: caller?.name },
    "dial: sending incoming_call notification"
  );

  const delivered = sendToAccount(calleeAccountId, {
    type: "incoming_call",
    callId: call.id,
    callerName: caller?.name || "Unknown",
    taskContext: taskContext ? {
      taskId: taskContext.id,
      title: taskContext.title,
      description: taskContext.description,
    } : null,
  });
  logger.info(
    { callId: call.id, calleeAccountId, delivered, status: call.status },
    "dial: incoming_call push result"
  );

  if (!delivered) {
    logger.warn(
      { callId: call.id, calleeAccountId },
      "dial: failed to deliver incoming_call notification - callee may be offline"
    );
  }

  logger.info({ callId: call.id, status: call.status, calleeAccountId }, "dial: call created successfully, returning to caller");

  // Start a timeout to automatically mark as missed after ~25 seconds
  setTimeout(async () => {
    const updatedCall = await prisma.call.findUnique({
      where: { id: call.id },
      select: { status: true },
    });

    // Only mark as missed if still ringing (not in-progress, completed, etc.)
    if (updatedCall?.status === "ringing") {
      await prisma.call.update({
        where: { id: call.id },
        data: { status: "missed" },
      });

      // Notify the caller that the call was missed
      sendToAccount(req.userId!, {
        type: "call_status",
        callId: call.id,
        status: "missed",
      });

      logger.info({ callId: call.id }, "Call automatically marked as missed after timeout");
    }
  }, 25000);

  logger.info({ contactId, calleeAccountId }, "Call initiated - ringing");
  res.status(200).json({ callId: call.id, status: "ringing" });
}, "Failed to dial call"));

// ---------------------------------------------------------------------------
// POST /api/calls/:id/accept — accept an incoming call (service only)
// ---------------------------------------------------------------------------

router.post("/calls/:id/accept", requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;

  logger.info({ callId: id, userId: req.userId }, "calls: accept request received");

  const call = await prisma.call.findUnique({
    where: { id: String(id) },
    select: { calleeAccountId: true, status: true, conversationId: true, startedAt: true },
  });

  if (!call) {
    logger.warn({ callId: id }, "calls: call not found");
    res.status(404).json({ error: "Call not found" });
    return;
  }

  if (call.calleeAccountId !== req.userId!) {
    logger.warn({ callId: id, userId: req.userId, calleeAccountId: call.calleeAccountId }, "calls: user not authorized to accept");
    res.status(403).json({ error: "You can only accept calls directed at you" });
    return;
  }

  // Allow accepting if status is "ringing" (normal case) or "in-progress" (caller already connected)
  if (call.status !== "ringing" && call.status !== "in-progress") {
    logger.warn({ callId: id, status: call.status }, "calls: call not in ringing or in-progress state");
    res.status(400).json({ error: `Call is not in ringing state (status: ${call.status})` });
    return;
  }

  logger.info({ callId: id, currentStatus: call.status }, "calls: updating call to in-progress");

  // Update to in-progress (no-op if already in-progress)
  await prisma.call.update({
    where: { id: String(id) },
    data: {
      status: "in-progress",
      acceptedAt: new Date(),
      startedAt: call.startedAt || new Date(), // Set startedAt if not already set
    },
  });

  // Notify the caller that the call was accepted
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
    logger.info({ callId: id, callerId: conversation.contact.ownerId }, "Call accepted - notified caller");
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
