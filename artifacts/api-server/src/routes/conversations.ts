import { Router, type IRouter } from "express";
import { prisma } from "@workspace/db-prisma";

const router: IRouter = Router();

// Get all conversations
router.get("/conversations", async (_req, res) => {
  try {
    const conversations = await prisma.conversation.findMany({
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
        history: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// Get a single conversation with messages
router.get("/conversations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
        history: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
});

// Create a new conversation
router.post("/conversations", async (req, res) => {
  try {
    const { title } = req.body;
    const conversation = await prisma.conversation.create({
      data: {
        title,
      },
    });
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

// Update a conversation
router.put("/conversations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const conversation = await prisma.conversation.update({
      where: { id },
      data: { title },
    });
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: "Failed to update conversation" });
  }
});

// Delete a conversation (cascades to messages and history)
router.delete("/conversations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.conversation.delete({
      where: { id },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

export default router;
