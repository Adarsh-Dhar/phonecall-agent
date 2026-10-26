import { Router, type IRouter } from "express";
import { prisma } from "@workspace/db-prisma";
import { asyncHandler } from "../lib/asyncHandler";

const router: IRouter = Router();

// PATCH /knowledge/:id — user correction or manual invalidation
router.patch("/knowledge/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { value, status } = req.body;

  // Verify ownership via contact → owner (including linked contacts)
  const existing = await prisma.contactKnowledge.findFirst({
    where: { id: String(id) },
    include: { contact: true },
  });
  if (!existing) {
    res.status(404).json({ error: "Knowledge fact not found" });
    return;
  }

  // Check if user has access (either owns it directly or has it as a linked contact)
  const hasAccess = existing.contact.ownerId === req.userId! || 
    (await prisma.account.count({
      where: { ownerId: req.userId!, linkedAccountId: existing.contactId }
    })) > 0;

  if (!hasAccess) {
    res.status(404).json({ error: "Knowledge fact not found" });
    return;
  }

  const fact = await prisma.contactKnowledge.update({
    where: { id: String(id) },
    data: {
      ...(value  !== undefined ? { value }  : {}),
      ...(status !== undefined ? { status } : {}),
    },
  });
  res.json(fact);
}, "Failed to update knowledge"));

// DELETE /knowledge/:id
router.delete("/knowledge/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify ownership via contact → owner (including linked contacts)
  const existing = await prisma.contactKnowledge.findFirst({
    where: { id: String(id) },
    include: { contact: true },
  });
  if (!existing) {
    res.status(404).json({ error: "Knowledge fact not found" });
    return;
  }

  // Check if user has access (either owns it directly or has it as a linked contact)
  const hasAccess = existing.contact.ownerId === req.userId! || 
    (await prisma.account.count({
      where: { ownerId: req.userId!, linkedAccountId: existing.contactId }
    })) > 0;

  if (!hasAccess) {
    res.status(404).json({ error: "Knowledge fact not found" });
    return;
  }

  await prisma.contactKnowledge.delete({ where: { id: String(id) } });
  res.json({ success: true });
}, "Failed to delete knowledge"));

export default router;
