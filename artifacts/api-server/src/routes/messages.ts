import { Router, type IRouter } from "express";
import { prisma } from "../db-prisma";
import { scheduleExtraction } from "../services/taskExtraction";

const router: IRouter = Router();

// Get messages for a conversation
router.get("/conversations/:conversationId/messages", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Create a new message
router.post("/conversations/:conversationId/messages", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { role, content, time, pending } = req.body;
    const message = await prisma.message.create({
      data: {
        role,
        content,
        time,
        pending: pending || false,
        conversationId,
      },
    });
    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Schedule background task extraction — fire-and-forget, never blocks the response
    scheduleExtraction(conversationId);

    res.json(message);
  } catch (error) {
    res.status(500).json({ error: "Failed to create message" });
  }
});

// Update a message
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { role, content, time, pending } = req.body;
    const message = await prisma.message.update({
      where: { id },
      data: {
        role,
        content,
        time,
        pending,
      },
    });
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: "Failed to update message" });
  }
});

// Delete a message
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.message.delete({
      where: { id },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete message" });
  }
});

export default router;
