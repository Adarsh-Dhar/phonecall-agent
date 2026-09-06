import { Router, type IRouter } from "express";
import { prisma } from "@workspace/db-prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { endConversation } from "../services/conversations";
import "../lib/authMiddleware"; // Import to ensure Request type augmentation is applied

const router: IRouter = Router();

// Get all conversations (optionally scoped to one contact via ?contactId=)
router.get("/conversations", asyncHandler(async (req, res) => {
  const { contactId } = req.query;
  const conversations = await prisma.conversation.findMany({
    where: {
      contact: { ownerId: req.userId!, isService: true },
      ...(contactId ? { contactId: String(contactId) } : {}),
    },
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
}, "Failed to fetch conversations"));

// Get a contact's single chat thread (creating it on first contact if needed)
router.get("/contacts/:contactId/conversation", asyncHandler(async (req, res) => {
  const { contactId } = req.params;

  // First verify the contact belongs to the user
  const contact = await prisma.account.findFirst({
    where: { id: String(contactId), ownerId: req.userId!, isService: true },
  });
  if (!contact) {
    res.status(404).json({ error: "Contact not found" });
    return;
  }

  let conversation = await prisma.conversation.findFirst({
    where: { contactId: String(contactId) },
    include: {
      contact: true,
      messages: { orderBy: { createdAt: "asc" } },
      history:  { orderBy: { createdAt: "desc" } },
    },
    orderBy: { updatedAt: "desc" },
  });
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { title: `Chat with ${contact.name}`, contactId: String(contactId) },
      include: { contact: true, messages: true, history: true },
    });
  }
  res.json(conversation);
}, "Failed to fetch contact's conversation"));

// Get a single conversation with messages
router.get("/conversations/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const conversation = await prisma.conversation.findFirst({
    where: { id: String(id), contact: { ownerId: req.userId!, isService: true } },
    include: {
      contact: true,
      messages: { orderBy: { createdAt: "asc" } },
      history:  { orderBy: { createdAt: "desc" } },
    },
  });
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  res.json(conversation);
}, "Failed to fetch conversation"));

// Create a new conversation for a contact (contactId is required —
// every conversation is a specific contact's chat thread)
router.post("/conversations", asyncHandler(async (req, res) => {
  const { title, contactId } = req.body;
  if (!contactId) {
    res.status(400).json({ error: "contactId is required" });
    return;
  }
  // Verify the contact belongs to this user
  const contact = await prisma.account.findFirst({
    where: { id: String(contactId), ownerId: req.userId!, isService: true },
  });
  if (!contact) {
    res.status(404).json({ error: "Contact not found" });
    return;
  }
  const conversation = await prisma.conversation.create({
    data: { title, contactId: String(contactId) },
  });
  res.json(conversation);
}, "Failed to create conversation"));

// Update a conversation
router.put("/conversations/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  const existing = await prisma.conversation.findFirst({
    where: { id: String(id), contact: { ownerId: req.userId!, isService: true } },
  });
  if (!existing) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  const conversation = await prisma.conversation.update({
    where: { id: String(id) },
    data: { title },
  });
  res.json(conversation);
}, "Failed to update conversation"));

// Delete a conversation (cascades to messages and history)
router.delete("/conversations/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.conversation.findFirst({
    where: { id: String(id), contact: { ownerId: req.userId!, isService: true } },
  });
  if (!existing) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  await prisma.conversation.delete({ where: { id: String(id) } });
  res.json({ success: true });
}, "Failed to delete conversation"));

// End a conversation (mark as ended and generate topic summary)
router.post("/conversations/:id/end", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.conversation.findFirst({
    where: { id: String(id), contact: { ownerId: req.userId!, isService: true } },
  });
  if (!existing) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  const conversation = await endConversation(String(id));
  res.json(conversation);
}, "Failed to end conversation"));

// Get messages for a specific call (only actual call transcript, no query answers)
router.get("/calls/:callId/messages", asyncHandler(async (req, res) => {
  const { callId } = req.params;

  // Verify the call belongs to this user before returning its transcript
  const call = await prisma.call.findFirst({
    where: { id: String(callId), contact: { ownerId: req.userId!, isService: true } },
  });
  if (!call) {
    res.status(404).json({ error: "Call not found" });
    return;
  }

  const messages = await prisma.message.findMany({
    where: {
      callId: String(callId),
      role: { in: ['user', 'assistant'] },
      NOT: {
        content: {
          startsWith: 'Answering:',
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  res.json(messages);
}, "Failed to fetch call messages"));

export default router;
