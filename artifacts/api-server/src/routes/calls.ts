/**
 * Calls REST API
 *
 * GET  /api/calls                               — list all calls
 * GET  /api/calls/:id                           — poll call status
 * GET  /api/conversations/:conversationId/calls — list calls for a conversation
 *
 * Calls themselves are created and completed by the browser voice transport
 * (services/voiceStreamBrowser.ts) when a "Test Call in Browser" session
 * starts/ends — there's no separate call-origination endpoint since there's
 * no telephony carrier to dial out through.
 */

import { Router, type IRouter } from "express";
import { prisma } from "@workspace/db-prisma";
import { contactCardSelect, contactCardSelectWithPhone } from "../lib/prismaSelects";

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// GET /api/calls — list all calls across all conversations
// ---------------------------------------------------------------------------

router.get("/calls", async (req, res) => {
  const calls = await prisma.call.findMany({
    where: { contact: { userId: req.userId! } },
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
  const call = await prisma.call.findFirst({
    where: { id: String(id), contact: { userId: req.userId! } },
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
    where: { id: String(conversationId), contact: { userId: req.userId! } },
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

export default router;