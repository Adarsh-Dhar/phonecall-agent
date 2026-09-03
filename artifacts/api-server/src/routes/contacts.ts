import { Router, type IRouter } from "express";
import { prisma } from "@workspace/db-prisma";
import { asyncHandler } from "../lib/asyncHandler";

const router: IRouter = Router();

// Get all contacts (optionally filter by category), including their conversation thread ids
router.get("/contacts", asyncHandler(async (req, res) => {
  const { category } = req.query;
  const contacts = await prisma.contact.findMany({
    where: category ? { category: String(category) } : undefined,
    include: {
      conversations: {
        select: { id: true, title: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(contacts);
}, "Failed to fetch contacts"));

// Create a new contact. If `withConversation` is truthy, also creates
// that contact's first (empty) chat thread in this same request.
router.post("/contacts", asyncHandler(async (req, res) => {
  const { name, business, category, phone, initials, color, note, online, withConversation } = req.body;
  const contact = await prisma.contact.create({
    data: {
      name,
      business,
      category,
      phone,
      initials,
      color,
      note,
      online: online || false,
      ...(withConversation
        ? { conversations: { create: { title: `Chat with ${name}` } } }
        : {}),
    },
    include: { conversations: true },
  });
  res.json(contact);
}, "Failed to create contact"));

// Get the active conversation for a contact
router.get("/contacts/:id/conversation", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const conversation = await prisma.conversation.findFirst({
    where: { contactId: String(id) },
    orderBy: { updatedAt: "desc" },
    include: {
      contact: true,
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!conversation) {
    // Return 404 but with a clear error message
    res.status(404).json({ error: "No conversation found for this contact" });
    return;
  }
  res.json(conversation);
}, "Failed to fetch contact conversation"));

// Update a contact
router.put("/contacts/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, business, category, phone, initials, color, note, online } = req.body;
  const contact = await prisma.contact.update({
    where: { id: String(id) },
    data: {
      name,
      business,
      category,
      phone,
      initials,
      color,
      note,
      online,
    },
  });
  res.json(contact);
}, "Failed to update contact"));

// Delete a contact
router.delete("/contacts/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.contact.delete({
    where: { id: String(id) },
  });
  res.json({ success: true });
}, "Failed to delete contact"));

export default router;