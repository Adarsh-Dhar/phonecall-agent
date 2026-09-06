import { Router, type IRouter } from "express";
import { prisma } from "@workspace/db-prisma";
import { asyncHandler } from "../lib/asyncHandler";
import "../lib/authMiddleware"; // Import to ensure Request type augmentation is applied

const router: IRouter = Router();

// Get all history items
router.get("/history", asyncHandler(async (req, res) => {
  const history = await prisma.history.findMany({
    where: { conversation: { contact: { ownerId: req.userId!, isService: true } } },
    include: {
      conversation: {
        include: {
          messages: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(history);
}, "Failed to fetch history"));

// Get history for a specific conversation
router.get("/conversations/:conversationId/history", asyncHandler(async (req, res) => {
  const { conversationId } = req.params;

  // Verify conversation belongs to user
  const conversation = await prisma.conversation.findFirst({
    where: { id: String(conversationId), contact: { ownerId: req.userId!, isService: true } },
  });
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const history = await prisma.history.findMany({
    where: { conversationId: String(conversationId) },
    orderBy: { createdAt: "desc" },
  });
  res.json(history);
}, "Failed to fetch history"));

// Create a new history item
router.post("/conversations/:conversationId/history", asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { title, detail, status, time } = req.body;

  // Verify conversation belongs to user
  const conversation = await prisma.conversation.findFirst({
    where: { id: String(conversationId), contact: { ownerId: req.userId!, isService: true } },
  });
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const history = await prisma.history.create({
    data: { title, detail, status, time, conversationId: String(conversationId) },
  });
  await prisma.conversation.update({
    where: { id: String(conversationId) },
    data: { updatedAt: new Date() },
  });
  res.json(history);
}, "Failed to create history item"));

// Update a history item
router.put("/history/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, detail, status, time } = req.body;

  // Verify ownership via conversation → contact (service account) → owner
  const existing = await prisma.history.findFirst({
    where: { id: String(id), conversation: { contact: { ownerId: req.userId!, isService: true } } },
  });
  if (!existing) {
    res.status(404).json({ error: "History item not found" });
    return;
  }
  const history = await prisma.history.update({
    where: { id: String(id) },
    data: { title, detail, status, time },
  });
  res.json(history);
}, "Failed to update history item"));

// Delete a history item
router.delete("/history/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify ownership via conversation → contact (service account) → owner
  const existing = await prisma.history.findFirst({
    where: { id: String(id), conversation: { contact: { ownerId: req.userId!, isService: true } } },
  });
  if (!existing) {
    res.status(404).json({ error: "History item not found" });
    return;
  }
  await prisma.history.delete({ where: { id: String(id) } });
  res.json({ success: true });
}, "Failed to delete history item"));

export default router;
