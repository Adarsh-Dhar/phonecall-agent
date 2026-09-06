import { Router, type IRouter } from "express";
import { prisma } from "@workspace/db-prisma";
import { scheduleExtraction } from "../services/taskExtraction";
import { asyncHandler } from "../lib/asyncHandler";
import "../lib/authMiddleware"; // Import to ensure Request type augmentation is applied

const router: IRouter = Router();

// Get messages for a conversation
router.get("/conversations/:conversationId/messages", asyncHandler(async (req, res) => {
  const { conversationId } = req.params;

  // Verify conversation belongs to user
  const conversation = await prisma.conversation.findFirst({
    where: { id: String(conversationId), contact: { ownerId: req.userId!, isService: true } },
  });
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: String(conversationId) },
    orderBy: { createdAt: "asc" },
  });
  res.json(messages);
}, "Failed to fetch messages"));

// Create a new message
router.post("/conversations/:conversationId/messages", asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { role, content, time, pending } = req.body;

  // Verify conversation belongs to user
  const conversation = await prisma.conversation.findFirst({
    where: { id: String(conversationId), contact: { ownerId: req.userId!, isService: true } },
  });
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const message = await prisma.message.create({
    data: {
      role,
      content,
      time,
      pending: pending || false,
      conversationId: String(conversationId),
    },
  });
  // Update conversation timestamp
  await prisma.conversation.update({
    where: { id: String(conversationId) },
    data: { updatedAt: new Date() },
  });

  // Schedule background task extraction — fire-and-forget, never blocks the response
  scheduleExtraction(String(conversationId));

  res.json(message);
}, "Failed to create message"));

// Update a message
router.put("/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role, content, time, pending } = req.body;

  // Verify ownership via conversation → contact (service account) → owner
  const existing = await prisma.message.findFirst({
    where: { id: String(id), conversation: { contact: { ownerId: req.userId!, isService: true } } },
  });
  if (!existing) {
    res.status(404).json({ error: "Message not found" });
    return;
  }
  const message = await prisma.message.update({
    where: { id: String(id) },
    data: { role, content, time, pending },
  });
  res.json(message);
}, "Failed to update message"));

// Delete a message
router.delete("/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify ownership via conversation → contact (service account) → owner
  const existing = await prisma.message.findFirst({
    where: { id: String(id), conversation: { contact: { ownerId: req.userId!, isService: true } } },
  });
  if (!existing) {
    res.status(404).json({ error: "Message not found" });
    return;
  }
  await prisma.message.delete({ where: { id: String(id) } });
  res.json({ success: true });
}, "Failed to delete message"));

export default router;
