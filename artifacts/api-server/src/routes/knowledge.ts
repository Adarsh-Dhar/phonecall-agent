import { Router, type IRouter } from "express";
import { prisma } from "../db-prisma";

const router: IRouter = Router();

// GET /contacts/:id/knowledge — active facts for a contact
router.get("/contacts/:id/knowledge", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;
    const facts = await prisma.contactKnowledge.findMany({
      where: { contactId: id, status: status ? String(status) : "active" },
      orderBy: [{ category: "asc" }, { updatedAt: "desc" }],
    });
    res.json(facts);
  } catch {
    res.status(500).json({ error: "Failed to fetch contact knowledge" });
  }
});

// PATCH /knowledge/:id — user correction or manual invalidation
router.patch("/knowledge/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { value, status } = req.body;
    const fact = await prisma.contactKnowledge.update({
      where: { id },
      data: {
        ...(value !== undefined ? { value } : {}),
        ...(status !== undefined ? { status } : {}),
      },
    });
    res.json(fact);
  } catch {
    res.status(500).json({ error: "Failed to update knowledge" });
  }
});

// DELETE /knowledge/:id
router.delete("/knowledge/:id", async (req, res) => {
  try {
    await prisma.contactKnowledge.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete knowledge" });
  }
});

export default router;
