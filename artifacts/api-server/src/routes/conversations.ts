import { Router, type IRouter } from "express";
import { prisma } from "@workspace/db-prisma";

const router: IRouter = Router();

// Get all conversations (optionally scoped to one contact via ?contactId=)
router.get("/conversations", async (req, res) => {
  try {
    const { contactId } = req.query;
    const conversations = await prisma.conversation.findMany({
      where: contactId ? { contactId: String(contactId) } : undefined,
      include: {
        contact: true,
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

// Get a contact's single chat thread (creating it on first contact if needed)
router.get("/contacts/:contactId/conversation", async (req, res) => {
  try {
    const { contactId } = req.params;
    let conversation = await prisma.conversation.findFirst({
      where: { contactId },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        history: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { updatedAt: "desc" },
    });
    if (!conversation) {
      const contact = await prisma.contact.findUnique({ where: { id: contactId } });
      if (!contact) {
        res.status(404).json({ error: "Contact not found" });
        return;
      }
      conversation = await prisma.conversation.create({
        data: { title: `Chat with ${contact.name}`, contactId },
        include: { messages: true, history: true },
      });
    }
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch contact's conversation" });
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

// Create a new conversation for a contact (contactId is required —
// every conversation is a specific contact's chat thread)
router.post("/conversations", async (req, res) => {
  try {
    const { title, contactId } = req.body;
    if (!contactId) {
      res.status(400).json({ error: "contactId is required" });
      return;
    }
    const conversation = await prisma.conversation.create({
      data: {
        title,
        contactId,
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
