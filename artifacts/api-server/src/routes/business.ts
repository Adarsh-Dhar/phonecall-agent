import { Router, type IRouter } from 'express';
import { prisma } from '@workspace/db-prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { isOnline } from '../services/presence';
import { requireBusiness } from '../lib/roles';
import { getAccountRole } from '../lib/roles';
import { syncTaskToCalendar } from '../services/googleCalendar';
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
import { validateBusinessHours, DEFAULT_BUSINESS_HOURS } from '../services/schedulerPolicy';
import { validateClosureInput, CLOSURE_LIMITS, closureStatus } from '../services/closurePolicy';
import { loadClosureInfo, toPublicClosure, type ClosureRow } from '../services/businessClosures';
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

    // Closure / hours advisories are for individuals dialing a business (see routes/calls.ts).
    const response: any = { callId: result.call.id, status: 'ringing' };

    res.status(200).json(response);
    return;
  } catch (e) {
    logger.error({ error: e }, 'dial: failed to create call');
    if (e instanceof NotInContactsError) {
      res.status(403).json({ error: e.message, code: 'NOT_IN_CONTACTS' });
      return;
    }
    // Handle business hours/closure errors from dialCallAs
    if (e instanceof Error && (e as any).code) {
      const error = e as any;
      if (error.code === 'BUSINESS_CLOSED') {
        // Create a task to call back at the next available time
        if (error.reopensAt) {
          try {
            const contact = await prisma.account.findUnique({
              where: { id: String(contactId) },
              select: { id: true, name: true },
            });
            if (contact) {
              // Find or create a conversation for this contact
              let conversation = await prisma.conversation.findFirst({
                where: { contactId: contact.id },
              });
              if (!conversation) {
                conversation = await prisma.conversation.create({
                  data: {
                    contactId: contact.id,
                    title: `Chat with ${contact.name}`,
                  },
                });
              }

              const nextAttemptAt = new Date(error.reopensAt);
              
              // Check if a task already exists for this contact at the same time
              const existingTask = await prisma.task.findFirst({
                where: {
                  contactId: contact.id,
                  dueDate: nextAttemptAt,
                  status: { in: ['open', 'suggested'] },
                },
              });

              if (!existingTask) {
                const task = await prisma.task.create({
                  data: {
                    title: `Call ${contact.name}`,
                    description: 'Call rescheduled due to business hours',
                    status: 'open',
                    kind: 'call',
                    contactId: contact.id,
                    conversationId: conversation.id,
                    dueDate: nextAttemptAt,
                    nextAttemptAt: nextAttemptAt,
                    schedulerStatus: 'pending',
                    callAttempts: 0,
                  },
                  include: { contact: true },
                });
                logger.info({ contactId: contact.id, nextAttemptAt }, 'Created callback task for blocked call');

                // Sync to Google Calendar (non-blocking)
                syncTaskToCalendar({
                  id: task.id,
                  title: task.title,
                  description: task.description,
                  dueDate: task.dueDate,
                  status: task.status,
                  googleEventId: task.googleEventId,
                  kind: task.kind,
                  meta: task.meta,
                  contact: { name: task.contact.name || '', business: task.contact.business || '' },
                  userId: req.userId!,
                }).catch((err) => {
                  logger.error({ err, taskId: task.id }, 'Failed to sync task to calendar');
                });
              } else {
                logger.info({ contactId: contact.id, nextAttemptAt, existingTaskId: existingTask.id }, 'Task already exists for this time, skipping creation');
              }
            }
          } catch (taskError) {
            logger.error({ error: taskError }, 'Failed to create callback task for blocked call');
          }
        }

        res.status(409).json({
          error: error.message,
          code: error.code,
          reopensAt: error.reopensAt,
          kind: error.kind,
          label: error.label,
        });
        return;
      }
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
      (a.name?.toLowerCase().startsWith(lq) ? 2 : 0) +
      (a.email?.toLowerCase().includes(lq) ? 1 : 0);
    const bScore =
      (b.email?.toLowerCase().startsWith(lq) ? 3 : 0) +
      (b.name?.toLowerCase().startsWith(lq) ? 2 : 0) +
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

  // Verify the target account exists and is a public account (not someone's private contact)
  const target = await prisma.account.findUnique({
    where: { id: String(accountId) },
    select: {
      id: true,
      name: true,
      email: true,
      picture: true,
      isService: true,
      ownerId: true,
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

  // Reject private service accounts (owned by another user)
  if (target.ownerId !== null) {
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

  // Ensure the contact has a valid business/email field
  const businessField = target.business ?? target.email;
  if (!businessField) {
    res.status(400).json({ error: 'Contact must have a business name or email' });
    return;
  }

  // Derive display initials from name if the target hasn't set them
  const initials = target.initials
    ?? (target.name
         ?.split(' ')
         .slice(0, 2)
         .map((w) => w[0]?.toUpperCase() ?? '')
         .join('') ?? '');

  // Pick a deterministic accent color from a palette when none is set
  const COLORS = ['#ff9b83','#f7ad92','#8fc9b0','#e0b568','#c9a4dd','#7fa8dd','#7fb3d5','#a8c9a8'];
  const color = target.color ?? COLORS[Math.abs(target.id.charCodeAt(0) - 97) % COLORS.length];

  const contact = await prisma.account.create({
    data: {
      isService: true,
      ownerId: req.userId!,
      linkedAccountId: target.id,
      name: target.name,
      business: businessField,
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

// ---------------------------------------------------------------------------
// GET /api/business/settings
// Get the business's own settings (hours and timezone).
// ---------------------------------------------------------------------------
router.get('/settings', requireBusiness, asyncHandler(async (req, res) => {
  const business = await prisma.account.findUnique({
    where: { id: req.userId! },
    select: { businessHoursJson: true, timezone: true },
  });
  if (!business) {
    res.status(404).json({ error: 'Business account not found' });
    return;
  }

  const hours = business.businessHoursJson
    ? JSON.parse(business.businessHoursJson)
    : DEFAULT_BUSINESS_HOURS;
  const isDefault = !business.businessHoursJson;

  const now = new Date();
  const info = (await loadClosureInfo([req.userId!], now)).get(req.userId!);
  const activeClosure = info?.active ? toPublicClosure(info.active, now) : null;

  res.json({ hours, isDefault, timezone: business.timezone, closedNow: !!activeClosure, activeClosure });
}, 'Failed to fetch business settings'));

// ---------------------------------------------------------------------------
// PATCH /api/business/settings
// Update the business's own settings (hours and timezone).
// ---------------------------------------------------------------------------
router.patch('/settings', requireBusiness, asyncHandler(async (req, res) => {
  const { businessHours, timezone } = req.body;

  // Validate hours if provided
  if (businessHours !== undefined && businessHours !== null) {
    try {
      validateBusinessHours(businessHours);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid business hours' });
      return;
    }
  }

  // Validate timezone if provided
  if (timezone !== undefined && timezone !== null) {
    if (typeof timezone !== 'string') {
      res.status(400).json({ error: 'timezone must be a string' });
      return;
    }
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: timezone });
    } catch {
      res.status(400).json({ error: 'timezone is not a valid IANA timezone' });
      return;
    }
  }

  // Build update data
  const updateData: any = {};
  if (businessHours !== undefined) {
    updateData.businessHoursJson = businessHours === null ? null : JSON.stringify(businessHours);
  }
  if (timezone !== undefined) {
    updateData.timezone = timezone;
  }

  const updated = await prisma.account.update({
    where: { id: req.userId! },
    data: updateData,
    select: { businessHoursJson: true, timezone: true },
  });

  const hours = updated.businessHoursJson
    ? JSON.parse(updated.businessHoursJson)
    : DEFAULT_BUSINESS_HOURS;
  const isDefault = !updated.businessHoursJson;

  const now = new Date();
  const info = (await loadClosureInfo([req.userId!], now)).get(req.userId!);
  const activeClosure = info?.active ? toPublicClosure(info.active, now) : null;

  res.json({ hours, isDefault, timezone: updated.timezone, closedNow: !!activeClosure, activeClosure });
}, 'Failed to update business settings'));

// ---------------------------------------------------------------------------
// Closures: holidays, emergencies and out-of-service periods (business only).
// During a closure the scheduler does not call this business; see
// services/schedulerPolicy.ts. Everything is scoped to the signed-in business.
// ---------------------------------------------------------------------------
const PAST_DAYS_SHOWN = 30;

async function businessTimezone(businessId: string): Promise<string | null> {
  const acc = await prisma.account.findUnique({ where: { id: businessId }, select: { timezone: true } });
  return acc?.timezone ?? null;
}

async function findActiveOutOfService(businessId: string, now: Date) {
  return prisma.businessClosure.findFirst({
    where: {
      businessId,
      kind: { in: ['out_of_service', 'emergency'] },
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gt: now } }],
    },
  });
}

router.get('/closures', requireBusiness, asyncHandler(async (req, res) => {
  const now = new Date();
  const since = new Date(now.getTime() - PAST_DAYS_SHOWN * 24 * 60 * 60 * 1000);
  const rows = (await prisma.businessClosure.findMany({
    where: { businessId: req.userId!, OR: [{ endsAt: null }, { endsAt: { gt: since } }] },
    orderBy: { startsAt: 'asc' },
  })) as ClosureRow[];
  res.json(rows.map((r) => toPublicClosure(r, now)));
}, 'Failed to list closures'));

router.post('/closures', requireBusiness, asyncHandler(async (req, res) => {
  const now = new Date();
  const tz = await businessTimezone(req.userId!);
  const parsed = validateClosureInput(req.body ?? {}, { timezone: tz, now });
  if (!parsed.ok) { res.status(400).json({ error: parsed.error }); return; }

  const count = await prisma.businessClosure.count({
    where: { businessId: req.userId!, OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
  });
  if (count >= CLOSURE_LIMITS.maxClosures) {
    res.status(400).json({ error: `You can have at most ${CLOSURE_LIMITS.maxClosures} current and upcoming closures` });
    return;
  }
  if (
    parsed.value.kind !== 'holiday' &&
    parsed.value.startsAt.getTime() <= now.getTime() &&
    (await findActiveOutOfService(req.userId!, now))
  ) {
    res.status(409).json({ error: 'You are already marked out of service. Reopen first.' });
    return;
  }

  const row = await prisma.businessClosure.create({ data: { businessId: req.userId!, ...parsed.value } });
  res.status(201).json(toPublicClosure(row as ClosureRow, now));
}, 'Failed to create closure'));

// Quick switch: out of service from now, until a time or until the business reopens.
router.post('/closures/out-of-service', requireBusiness, asyncHandler(async (req, res) => {
  const now = new Date();
  const { message, until, untilLocal, blockCalls, emergency, label } = req.body ?? {};
  const tz = await businessTimezone(req.userId!);
  const parsed = validateClosureInput(
    {
      kind: emergency === true ? 'emergency' : 'out_of_service',
      label,
      message,
      startsAt: now.toISOString(),
      endsAt: until ?? null,
      endLocal: untilLocal,
      blockCalls,
    },
    { timezone: tz, now },
  );
  if (!parsed.ok) { res.status(400).json({ error: parsed.error }); return; }
  if (await findActiveOutOfService(req.userId!, now)) {
    res.status(409).json({ error: 'You are already marked out of service. Reopen first.' });
    return;
  }
  const row = await prisma.businessClosure.create({ data: { businessId: req.userId!, ...parsed.value } });
  res.status(201).json(toPublicClosure(row as ClosureRow, now));
}, 'Failed to mark out of service'));

// Full replace of an existing closure (same body as POST /closures).
router.put('/closures/:id', requireBusiness, asyncHandler(async (req, res) => {
  const now = new Date();
  const existing = await prisma.businessClosure.findFirst({ where: { id: String(req.params.id), businessId: req.userId! } });
  if (!existing) { res.status(404).json({ error: 'Closure not found' }); return; }
  if (closureStatus(existing, now) === 'past') {
    res.status(400).json({ error: 'A closure that has ended cannot be edited' });
    return;
  }
  const tz = await businessTimezone(req.userId!);
  const parsed = validateClosureInput(req.body ?? {}, { timezone: tz, now });
  if (!parsed.ok) { res.status(400).json({ error: parsed.error }); return; }
  const row = await prisma.businessClosure.update({ where: { id: existing.id }, data: parsed.value });
  res.json(toPublicClosure(row as ClosureRow, now));
}, 'Failed to update closure'));

// Reopen now: ends an active closure at the current time.
router.post('/closures/:id/end', requireBusiness, asyncHandler(async (req, res) => {
  const now = new Date();
  const existing = await prisma.businessClosure.findFirst({ where: { id: String(req.params.id), businessId: req.userId! } });
  if (!existing) { res.status(404).json({ error: 'Closure not found' }); return; }
  if (closureStatus(existing, now) !== 'active') {
    res.status(400).json({ error: 'Only a closure in progress can be ended. Delete an upcoming one instead.' });
    return;
  }
  const row = await prisma.businessClosure.update({ where: { id: existing.id }, data: { endsAt: now } });
  res.json(toPublicClosure(row as ClosureRow, now));
}, 'Failed to end closure'));

router.delete('/closures/:id', requireBusiness, asyncHandler(async (req, res) => {
  const result = await prisma.businessClosure.deleteMany({ where: { id: String(req.params.id), businessId: req.userId! } });
  if (result.count === 0) { res.status(404).json({ error: 'Closure not found' }); return; }
  res.status(204).end();
}, 'Failed to delete closure'));

export default router;
