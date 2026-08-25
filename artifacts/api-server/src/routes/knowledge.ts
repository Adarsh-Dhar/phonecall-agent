import { Router, type IRouter } from "express";
import { prisma } from "@workspace/db-prisma";
import { asyncHandler } from "../lib/asyncHandler";

const router: IRouter = Router();

// GET /contacts/:id/knowledge — active facts for a contact
router.get("/contacts/:id/knowledge", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.query;
  const facts = await prisma.contactKnowledge.findMany({
    where: { contactId: String(id), status: status ? String(status) : "active" },
    orderBy: [{ category: "asc" }, { updatedAt: "desc" }],
  });
  res.json(facts);
}, "Failed to fetch contact knowledge"));

// POST /contacts/:id/knowledge — manual creation of knowledge facts
router.post("/contacts/:id/knowledge", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { category, key, value, confidence } = req.body as {
    category?: string;
    key?: string;
    value?: string;
    confidence?: number;
  };

  if (!category || !key || !value) {
    res.status(400).json({ error: "category, key, and value are required" });
    return;
  }

  const fact = await prisma.contactKnowledge.upsert({
    where: { contactId_key: { contactId: String(id), key: String(key) } },
    create: {
      contactId: String(id),
      category: String(category),
      key: String(key),
      value: String(value),
      confidence: typeof confidence === "number" ? confidence : 1.0,
      status: "active",
    },
    update: {
      category: String(category),
      value: String(value),
      confidence: typeof confidence === "number" ? confidence : 1.0,
      status: "active",
    },
  });

  res.status(201).json(fact);
}, "Failed to create knowledge fact"));

// PATCH /knowledge/:id — user correction or manual invalidation
router.patch("/knowledge/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { value, status } = req.body;
  const fact = await prisma.contactKnowledge.update({
    where: { id: String(id) },
    data: {
      ...(value !== undefined ? { value } : {}),
      ...(status !== undefined ? { status } : {}),
    },
  });
  res.json(fact);
}, "Failed to update knowledge"));

// DELETE /knowledge/:id
router.delete("/knowledge/:id", asyncHandler(async (req, res) => {
  await prisma.contactKnowledge.delete({ where: { id: String(req.params.id) } });
  res.json({ success: true });
}, "Failed to delete knowledge"));

export default router;
