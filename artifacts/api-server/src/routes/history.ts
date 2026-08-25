import { Router, type IRouter } from "express";
import { prisma } from "@workspace/db-prisma";
import { asyncHandler } from "../lib/asyncHandler";

const router: IRouter = Router();

// Get all history items
router.get("/history", asyncHandler(async (_req, res) => {
  const history = await prisma.history.findMany({
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
  const history = await prisma.history.create({
    data: {
      title,
      detail,
      status,
      time,
      conversationId: String(conversationId),
    },
  });
  // Update conversation timestamp
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
  const history = await prisma.history.update({
    where: { id: String(id) },
    data: {
      title,
      detail,
      status,
      time,
    },
  });
  res.json(history);
}, "Failed to update history item"));

// Delete a history item
router.delete("/history/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.history.delete({
    where: { id: String(id) },
  });
  res.json({ success: true });
}, "Failed to delete history item"));

export default router;
