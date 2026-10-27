import { Router, type IRouter } from "express";
import { prisma } from "@workspace/db-prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { endConversation } from "../services/conversations";
import { scheduleExtraction, runExtraction } from "../services/taskExtraction";
import { sourcesInclude } from "../lib/prismaSelects";
import "../lib/authMiddleware"; // Import to ensure Request type augmentation is applied

const router: IRouter = Router();

// Get all conversations (optionally scoped to one contact via ?contactId=)
router.get("/", asyncHandler(async (req, res) => {
  const { contactId } = req.query;
  const conversations = await prisma.conversation.findMany({
    where: {
      contact: { ownerId: req.userId! },
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
  // Convert BigInt to string to avoid serialization errors
  const serialized = conversations.map(c => ({
    ...c,
    messages: c.messages.map(m => ({
      ...m,
      seq: m.seq?.toString() ?? null,
    })),
  }));
  res.json(serialized);
}, "Failed to fetch conversations"));

// Get a contact's single chat thread (creating it on first contact if needed)
router.get("/contacts/:contactId/conversation", asyncHandler(async (req, res) => {
  const { contactId } = req.params;

  // First verify the contact belongs to the user
  const contact = await prisma.account.findFirst({
    where: { id: String(contactId), ownerId: req.userId! },
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
  // Convert BigInt to string to avoid serialization errors
  const serialized = {
    ...conversation,
    messages: conversation.messages.map(m => ({
      ...m,
      seq: m.seq?.toString() ?? null,
    })),
  };
  res.json(serialized);
}, "Failed to fetch contact's conversation"));

// Get a single conversation with messages
router.get("/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const conversation = await prisma.conversation.findFirst({
    where: { id: String(id), contact: { ownerId: req.userId! } },
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
  // Convert BigInt to string to avoid serialization errors
  const serialized = {
    ...conversation,
    messages: conversation.messages.map(m => ({
      ...m,
      seq: m.seq?.toString() ?? null,
    })),
  };
  res.json(serialized);
}, "Failed to fetch conversation"));

// Create a new conversation for a contact (contactId is required —
// every conversation is a specific contact's chat thread)
router.post("/", asyncHandler(async (req, res) => {
  const { title, contactId } = req.body;
  if (!contactId) {
    res.status(400).json({ error: "contactId is required" });
    return;
  }
  // Verify the contact belongs to this user
  const contact = await prisma.account.findFirst({
    where: { id: String(contactId), ownerId: req.userId! },
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
router.put("/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  const existing = await prisma.conversation.findFirst({
    where: { id: String(id), contact: { ownerId: req.userId! } },
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
router.delete("/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.conversation.findFirst({
    where: { id: String(id), contact: { ownerId: req.userId! } },
  });
  if (!existing) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  await prisma.conversation.delete({ where: { id: String(id) } });
  res.json({ success: true });
}, "Failed to delete conversation"));

// End a conversation (mark as ended and generate topic summary)
router.post("/:id/end", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.conversation.findFirst({
    where: { id: String(id), contact: { ownerId: req.userId! } },
  });
  if (!existing) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  const conversation = await endConversation(String(id));
  res.json(conversation);
}, "Failed to end conversation"));

// Get messages for a conversation
router.get("/:id/messages", asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify conversation belongs to user
  const conversation = await prisma.conversation.findFirst({
    where: { id: String(id), contact: { ownerId: req.userId! } },
  });
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: String(id) },
    orderBy: { createdAt: "asc" },
  });
  // Convert BigInt to string to avoid serialization errors
  const serialized = messages.map(m => ({
    ...m,
    seq: m.seq?.toString() ?? null,
  }));
  res.json(serialized);
}, "Failed to fetch messages"));

// Create a new message
router.post("/:id/messages", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role, content, time, pending } = req.body;

  // Verify conversation belongs to user
  const conversation = await prisma.conversation.findFirst({
    where: { id: String(id), contact: { ownerId: req.userId! } },
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
      conversationId: String(id),
    },
  });
  // Update conversation timestamp
  await prisma.conversation.update({
    where: { id: String(id) },
    data: { updatedAt: new Date() },
  });

  // Schedule background task extraction — fire-and-forget, never blocks the response
  scheduleExtraction(String(id));

  res.json(message);
}, "Failed to create message"));

// Get history for a conversation
router.get("/:id/history", asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify conversation belongs to user
  const conversation = await prisma.conversation.findFirst({
    where: { id: String(id), contact: { ownerId: req.userId! } },
  });
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const history = await prisma.history.findMany({
    where: { conversationId: String(id) },
    orderBy: { createdAt: "desc" },
  });
  res.json(history);
}, "Failed to fetch history"));

// Create a new history item
router.post("/:id/history", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, detail, status, time } = req.body;

  // Verify conversation belongs to user
  const conversation = await prisma.conversation.findFirst({
    where: { id: String(id), contact: { ownerId: req.userId! } },
  });
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const history = await prisma.history.create({
    data: { title, detail, status, time, conversationId: String(id) },
  });
  await prisma.conversation.update({
    where: { id: String(id) },
    data: { updatedAt: new Date() },
  });
  res.json(history);
}, "Failed to create history item"));

// Get tasks for a conversation
router.get("/:id/tasks", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.query;

  // Verify conversation belongs to user
  const conversation = await prisma.conversation.findFirst({
    where: { id: String(id), contact: { ownerId: req.userId! } },
  });
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const tasks = await prisma.task.findMany({
    where: {
      conversationId: String(id),
      ...(status ? { status: String(status) } : {}),
    },
    include: sourcesInclude,
    orderBy: { createdAt: "asc" },
  });

  res.json(tasks);
}, "Failed to fetch conversation tasks"));

// Manual "extract now" — bypasses debounce. Useful for the UI "Check for tasks"
// button or for backfilling old conversations.
router.post("/:id/extract", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const conversation = await prisma.conversation.findFirst({
    where: { id: String(id), contact: { ownerId: req.userId! } },
  });
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  const result = await runExtraction(String(id));
  res.json({ ok: true, ...result });
}, "Extraction failed"));

// NOTE: GET /calls/:callId/messages has been moved to routes/calls.ts
// to support both individual and business roles

export default router;
