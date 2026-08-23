import { Router, type IRouter } from "express";
import { prisma } from "../db-prisma";

const router: IRouter = Router();

// Get all history items
router.get("/history", async (_req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// Get history for a specific conversation
router.get("/conversations/:conversationId/history", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const history = await prisma.history.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// Create a new history item
router.post("/conversations/:conversationId/history", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { title, detail, status, time } = req.body;
    const history = await prisma.history.create({
      data: {
        title,
        detail,
        status,
        time,
        conversationId,
      },
    });
    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: "Failed to create history item" });
  }
});

// Update a history item
router.put("/history/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, detail, status, time } = req.body;
    const history = await prisma.history.update({
      where: { id },
      data: {
        title,
        detail,
        status,
        time,
      },
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: "Failed to update history item" });
  }
});

// Delete a history item
router.delete("/history/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.history.delete({
      where: { id },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete history item" });
  }
});

export default router;
