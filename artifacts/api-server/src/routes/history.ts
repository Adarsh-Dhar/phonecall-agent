import { Router, type IRouter } from "express";
import { prisma } from "@workspace/db-prisma";
import { asyncHandler } from "../lib/asyncHandler";
import "../lib/authMiddleware"; // Import to ensure Request type augmentation is applied

const router: IRouter = Router();

// Get all history items
router.get("/", asyncHandler(async (req, res) => {
  const history = await prisma.history.findMany({
    where: { conversation: { contact: { ownerId: req.userId! } } },
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

// Update a history item
router.put("/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, detail, status, time } = req.body;

  // Verify ownership via conversation → contact → owner
  const existing = await prisma.history.findFirst({
    where: { id: String(id), conversation: { contact: { ownerId: req.userId! } } },
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
router.delete("/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify ownership via conversation → contact → owner
  const existing = await prisma.history.findFirst({
    where: { id: String(id), conversation: { contact: { ownerId: req.userId! } } },
  });
  if (!existing) {
    res.status(404).json({ error: "History item not found" });
    return;
  }
  await prisma.history.delete({ where: { id: String(id) } });
  res.json({ success: true });
}, "Failed to delete history item"));

export default router;
