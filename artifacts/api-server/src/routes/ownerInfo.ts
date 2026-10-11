import { Router, type IRouter } from 'express';
import { prisma } from '@workspace/db-prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { validateOwnerInfoInput, LIMITS } from '../services/ownerInfo';

const router: IRouter = Router();

router.get('/', asyncHandler(async (req, res) => {
  const facts = await prisma.ownerInfo.findMany({
    where: { ownerId: req.userId! },
    orderBy: [{ category: 'asc' }, { updatedAt: 'desc' }],
  });
  res.json(facts);
}, 'Failed to list info'));

router.post('/', asyncHandler(async (req, res) => {
  const parsed = validateOwnerInfoInput(req.body ?? {});
  if (!parsed.ok) { res.status(400).json({ error: parsed.error }); return; }
  const count = await prisma.ownerInfo.count({ where: { ownerId: req.userId! } });
  const exists = await prisma.ownerInfo.findUnique({
    where: { ownerId_key: { ownerId: req.userId!, key: parsed.value.key } },
  });
  if (!exists && count >= LIMITS.maxFacts) { res.status(400).json({ error: 'Fact limit reached' }); return; }
  const fact = await prisma.ownerInfo.upsert({
    where: { ownerId_key: { ownerId: req.userId!, key: parsed.value.key } },
    create: { ownerId: req.userId!, ...parsed.value },
    update: { category: parsed.value.category, value: parsed.value.value, shareable: parsed.value.shareable },
  });
  res.status(201).json(fact);
}, 'Failed to save info'));

router.patch('/:id', asyncHandler(async (req, res) => {
  const existing = await prisma.ownerInfo.findFirst({ where: { id: String(req.params.id), ownerId: req.userId! } });
  if (!existing) { res.status(404).json({ error: 'Not found' }); return; }
  const parsed = validateOwnerInfoInput({ ...existing, ...req.body });
  if (!parsed.ok) { res.status(400).json({ error: parsed.error }); return; }
  const fact = await prisma.ownerInfo.update({
    where: { id: existing.id },
    data: { category: parsed.value.category, value: parsed.value.value, shareable: parsed.value.shareable },
  });
  res.json(fact);
}, 'Failed to update info'));

router.delete('/:id', asyncHandler(async (req, res) => {
  const result = await prisma.ownerInfo.deleteMany({ where: { id: String(req.params.id), ownerId: req.userId! } });
  if (result.count === 0) { res.status(404).json({ error: 'Not found' }); return; }
  res.status(204).end();
}, 'Failed to delete info'));

export default router;
