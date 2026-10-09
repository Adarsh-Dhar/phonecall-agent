import { Router, type IRouter } from 'express';
import { prisma } from '@workspace/db-prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { isOnline } from '../services/presence';
import { requireBusiness } from '../lib/roles';
import { getAccountRole } from '../lib/roles';
import {
  listCallsFor,
  getCallFor,
  getTranscriptFor,
  dialCallAs,
  acceptCallAs,
  declineCallAs,
  NotInContactsError,
} from '../services/callSignaling';
import { logger } from '../lib/logger';
import '../lib/authMiddleware'; // Import to ensure Request type augmentation is applied

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// Calls routes (accessible to both individual and business)
// Dynamically determines role and calls appropriate signaling functions
// ---------------------------------------------------------------------------

router.get('/calls', asyncHandler(async (req, res) => {
  const role = await getAccountRole(req);
  if (!role) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const calls = await listCallsFor(req.userId!, role);
  res.json(calls);
}, 'Failed to list calls'));

router.get('/calls/:id', asyncHandler(async (req, res) => {
  const role = await getAccountRole(req);
  if (!role) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { id } = req.params;
  const call = await getCallFor(String(id), req.userId!, role);
  if (!call) {
    res.status(404).json({ error: 'Call not found' });
    return;
  }
  res.json(call);
}, 'Failed to get call'));

router.get('/calls/:callId/messages', asyncHandler(async (req, res) => {
  const role = await getAccountRole(req);
  if (!role) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { callId } = req.params;
  const messages = await getTranscriptFor(String(callId), req.userId!, role);
  if (messages === null) {
    res.status(404).json({ error: 'Call not found' });
    return;
  }
  res.json(messages);
}, 'Failed to get call transcript'));

router.post('/calls/dial', asyncHandler(async (req, res) => {
  const role = await getAccountRole(req);
  if (!role) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { contactId, taskId } = req.body;

  if (!contactId) {
    res.status(400).json({ error: 'contactId is required' });
    return;
  }

  logger.info({ userId: req.userId, contactId, taskId, role }, 'dial: received call request');

  try {
    const result = await dialCallAs(String(contactId), taskId ? String(taskId) : null, req.userId!, role);

    if (result.status === 'missed') {
      res.status(202).json({ callId: result.call.id, status: 'missed' });
      return;
    }

    logger.info(
      { callId: result.call.id, status: result.status, delivered: result.delivered },
      'dial: call created successfully'
    );

    res.status(200).json({ callId: result.call.id, status: 'ringing' });
    return;
  } catch (e) {
    logger.error({ error: e }, 'dial: failed to create call');
    if (e instanceof NotInContactsError) {
      res.status(403).json({ error: e.message, code: 'NOT_IN_CONTACTS' });
      return;
    }
    res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to dial call' });
    return;
  }
}, 'Failed to dial call'));

router.post('/calls/:id/accept', asyncHandler(async (req, res) => {
  const role = await getAccountRole(req);
  if (!role) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { id } = req.params;

  logger.info({ callId: id, userId: req.userId, role }, 'calls: accept request received');

  try {
    const result = await acceptCallAs(String(id), req.userId!, role);
    logger.info({ callId: id, status: result.status }, 'Call accepted');
    res.json({ status: result.status });
    return;
  } catch (e) {
    logger.error({ error: e }, 'calls: failed to accept call');
    res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to accept call' });
    return;
  }
}, 'Failed to accept call'));

router.post('/calls/:id/decline', asyncHandler(async (req, res) => {
  const role = await getAccountRole(req);
  if (!role) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { id } = req.params;

  try {
    const result = await declineCallAs(String(id), req.userId!, role);
    logger.info({ callId: id, status: result.status }, 'Call declined');
    res.json({ status: result.status });
    return;
  } catch (e) {
    logger.error({ error: e }, 'calls: failed to decline call');
    res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to decline call' });
    return;
  }
}, 'Failed to decline call'));

// ---------------------------------------------------------------------------
// GET /api/business/accounts/search?q=<email or name>
// Search for individual accounts to add as contacts (business-only).
// Businesses can only add individual accounts.
// Excludes accounts already linked as contacts.
// Minimum 2 chars; returns up to 8 ranked results.
// ---------------------------------------------------------------------------

router.get('/accounts/search', requireBusiness, asyncHandler(async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  if (q.length < 2) {
    res.json([]);
    return;
  }

  // IDs already linked as contacts so we can exclude them
  const existingContacts = await prisma.account.findMany({
    where: { ownerId: req.userId!, isService: true },
    select: { linkedAccountId: true },
  });
  const linkedIds = existingContacts
    .map((c) => c.linkedAccountId)
    .filter((id): id is string => id !== null);

  // Exclude self and already-linked accounts
  const excludeIds = [req.userId!, ...linkedIds];

  // Businesses can only add individual accounts (isService: false, ownerId: null)
  const candidates = await prisma.account.findMany({
    where: {
      isService: false,
      ownerId: null,
      id: { notIn: excludeIds },
      OR: [
        { email: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
        { business: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      picture: true,
      isService: true,
      business: true,
      category: true,
      description: true,
    },
    take: 20,
  });

  // Rank: email/name that *starts with* q floats to the top
  const lq = q.toLowerCase();
  const ranked = candidates.sort((a, b) => {
    const aScore =
      (a.email?.toLowerCase().startsWith(lq) ? 3 : 0) +
      (a.name.toLowerCase().startsWith(lq) ? 2 : 0) +
      (a.email?.toLowerCase().includes(lq) ? 1 : 0);
    const bScore =
      (b.email?.toLowerCase().startsWith(lq) ? 3 : 0) +
      (b.name.toLowerCase().startsWith(lq) ? 2 : 0) +
      (b.email?.toLowerCase().includes(lq) ? 1 : 0);
    return bScore - aScore;
  });

  res.json(ranked.slice(0, 8));
}, 'Failed to search accounts'));

// ---------------------------------------------------------------------------
// GET /api/business/contacts
// List all contacts for the business.
// ---------------------------------------------------------------------------

router.get('/contacts', requireBusiness, asyncHandler(async (req, res) => {
  const { category } = req.query;
  const contacts = await prisma.account.findMany({
    where: {
      ownerId: req.userId!,
      isService: true,
      ...(category ? { category: String(category) } : {}),
    },
    select: {
      id: true,
      name: true,
      business: true,
      category: true,
      phone: true,
      initials: true,
      color: true,
      note: true,
      description: true,
      online: true,
      linkedAccountId: true,
      createdAt: true,
      updatedAt: true,
      conversations: {
        select: { id: true, title: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Resolve online status via presence registry for contacts with linkedAccountId
  // The online status should reflect the actual individual account, not the mirror contact
  const contactsWithLiveOnline = contacts.map(contact => ({
    ...contact,
    online: contact.linkedAccountId ? isOnline(contact.linkedAccountId) : false,
  }));

  res.json(contactsWithLiveOnline);
}, 'Failed to fetch contacts'));

// ---------------------------------------------------------------------------
// POST /api/business/contacts/from-account/:accountId
// Add an individual account as a contact.
// Businesses can only add individual accounts.
// ---------------------------------------------------------------------------

router.post('/contacts/from-account/:accountId', requireBusiness, asyncHandler(async (req, res) => {
  const { accountId } = req.params;

  // Verify the target account exists
  const target = await prisma.account.findUnique({
    where: { id: String(accountId) },
    select: {
      id: true,
      name: true,
      email: true,
      picture: true,
      isService: true,
      business: true,
      category: true,
      phone: true,
      initials: true,
      color: true,
      note: true,
      description: true,
    },
  });
  if (!target) {
    res.status(404).json({ error: 'Account not found' });
    return;
  }

  // Businesses can only add individual accounts
  if (target.isService) {
    res.status(400).json({ error: 'You can only add individual accounts as contacts' });
    return;
  }

  // Prevent self-linking
  if (target.id === req.userId!) {
    res.status(400).json({ error: 'Cannot add yourself as a contact' });
    return;
  }

  // Prevent duplicate links
  const existing = await prisma.account.findFirst({
    where: { ownerId: req.userId!, linkedAccountId: target.id },
  });
  if (existing) {
    res.status(409).json({ error: 'Already in your contacts' });
    return;
  }

  // Derive display initials from name if the target hasn't set them
  const initials = target.initials
    ?? target.name
         .split(' ')
         .slice(0, 2)
         .map((w) => w[0]?.toUpperCase() ?? '')
         .join('');

  // Pick a deterministic accent color from a palette when none is set
  const COLORS = ['#ff9b83','#f7ad92','#8fc9b0','#e0b568','#c9a4dd','#7fa8dd','#7fb3d5','#a8c9a8'];
  const color = target.color ?? COLORS[Math.abs(target.id.charCodeAt(0) - 97) % COLORS.length];

  const contact = await prisma.account.create({
    data: {
      isService: true,
      ownerId: req.userId!,
      linkedAccountId: target.id,
      name: target.name,
      business: target.business ?? target.email ?? '',
      category: target.category ?? 'Other',
      phone: target.phone ?? '',
      initials,
      color,
      note: target.description ?? target.note,
      online: false, // Will be resolved via presence when fetched
      conversations: {
        create: { title: `Chat with ${target.name}` },
      },
    },
    include: { conversations: true },
  });

  res.status(201).json(contact);
}, 'Failed to add contact from account'));

// ---------------------------------------------------------------------------
// DELETE /api/business/contacts/:id
// Delete a contact (cascades to conversations, tasks, knowledge, etc.)
// ---------------------------------------------------------------------------

router.delete('/contacts/:id', requireBusiness, asyncHandler(async (req, res) => {
  const { id } = req.params;
  // Verify ownership before delete
  const existing = await prisma.account.findFirst({
    where: { id: String(id), ownerId: req.userId!, isService: true },
  });
  if (!existing) {
    res.status(404).json({ error: 'Contact not found' });
    return;
  }
  await prisma.account.delete({ where: { id: String(id) } });
  res.json({ success: true });
}, 'Failed to delete contact'));

export default router;
