import { Router, type IRouter } from "express";
import { prisma } from "../db-prisma";

const router: IRouter = Router();

// Get all contacts (optionally filter by category), including their conversation thread ids
router.get("/contacts", async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
});

// Create a new contact. If `withConversation` is truthy, also creates
// that contact's first (empty) chat thread in the same call.
router.post("/contacts", async (req, res) => {
  try {
    const { name, business, category, phone, email, initials, color, note, online, withConversation } = req.body;
    const contact = await prisma.contact.create({
      data: {
        name,
        business,
        category,
        phone,
        email,
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
  } catch (error) {
    res.status(500).json({ error: "Failed to create contact" });
  }
});

// Update a contact
router.put("/contacts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, business, category, phone, email, initials, color, note, online } = req.body;
    const contact = await prisma.contact.update({
      where: { id },
      data: {
        name,
        business,
        category,
        phone,
        email,
        initials,
        color,
        note,
        online,
      },
    });
    res.json(contact);
  } catch (error) {
    res.status(500).json({ error: "Failed to update contact" });
  }
});

// Delete a contact
router.delete("/contacts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.contact.delete({
      where: { id },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete contact" });
  }
});

export default router;
