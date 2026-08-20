import { Router, type IRouter } from "express";
import { prisma } from "@workspace/db-prisma";

const router: IRouter = Router();

// Get all contacts
router.get("/contacts", async (_req, res) => {
  try {
    const contacts = await prisma.contact.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
});

// Create a new contact
router.post("/contacts", async (req, res) => {
  try {
    const { name, business, initials, color, note, online } = req.body;
    const contact = await prisma.contact.create({
      data: {
        name,
        business,
        initials,
        color,
        note,
        online: online || false,
      },
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
    const { name, business, initials, color, note, online } = req.body;
    const contact = await prisma.contact.update({
      where: { id },
      data: {
        name,
        business,
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
