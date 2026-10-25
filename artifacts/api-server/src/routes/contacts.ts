import { Router, type IRouter } from "express";
import { prisma } from "@workspace/db-prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { isOnline } from "../services/presence";
import { validateBusinessHours, resolveEffectiveHours } from "../services/schedulerPolicy";
import { loadClosureInfo, closureForIndividual } from "../services/businessClosures";
import { parseContactEmail, parseAllowFallback, hasUsableChannel, messagingView, NO_CHANNEL_ERROR } from "../services/outbound/contactFields";
import { queueIntroCall, cancelIntroCall } from '../services/introCall';
import "../lib/authMiddleware"; // Import to ensure Request type augmentation is applied

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// GET /accounts/search?q=<email or name>
// Discover registered app accounts to add as contacts.
// - Personal users (isService: false) → search service accounts only
// Excludes accounts already linked as contacts of the requester.
// Minimum 2 chars; returns up to 8 ranked results (email prefix match first).
// ---------------------------------------------------------------------------
router.get("/accounts/search", asyncHandler(async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  if (q.length < 2) {
    res.json([]);
    return;
  }

  // Determine the current account's type so we know which type to search for
  const me = await prisma.account.findUnique({
    where: { id: req.userId! },
    select: { isService: true, email: true },
  });
  if (!me) {
    res.status(401).json({ error: "Account not found" });
    return;
  }

  // Individuals can only search for business accounts (isService: true)
  const searchForService = true;

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

  // Additional protection: exclude accounts with very similar email patterns
  // to prevent users from seeing their other personal accounts in search
  if (me.email) {
    const myEmailBase = me.email.split('@')[0].replace(/[0-9]/g, '').toLowerCase();
    const myDomain = me.email.split('@')[1];

    const similarAccounts = await prisma.account.findMany({
      where: {
        ownerId: null,
        isService: true, // Only check business accounts
        id: { notIn: excludeIds },
        email: { not: null, contains: myDomain },
      },
      select: { id: true, email: true },
    });

    similarAccounts.forEach(acc => {
      if (acc.email) {
        const theirEmailBase = acc.email.split('@')[0].replace(/[0-9]/g, '').toLowerCase();
        // If the base parts match (ignoring numbers), exclude this account
        if (myEmailBase === theirEmailBase && myEmailBase.length > 3) {
          excludeIds.push(acc.id);
        }
      }
    });
  }

  // Fetch more than we'll return so we can rank client-side.
  // ownerId: null restricts results to *real, discoverable* accounts (people
  // who signed in with Google). Without this, other users' private contact
  // mirrors (rows they created via /contacts/from-account, which copy a
  // target's name/email into `business` and are owned by the person who
  // added them) leak into everyone's search — including mirrors that
  // describe the searching user themselves, since a mirror row's own id is
  // never in excludeIds.
  const candidates = await prisma.account.findMany({
    where: {
      isService: true, // Individuals can only add business accounts
      ownerId: null,
      id: { notIn: excludeIds },
      OR: [
        { email: { contains: q, mode: "insensitive" } },
        { name:  { contains: q, mode: "insensitive" } },
        { business: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id:        true,
      name:      true,
      email:     true,
      picture:   true,
      isService: true,
      business:  true,
      category:  true,
      description: true,
      businessHoursJson: true,
    },
    take: 20,
  });

  // Individuals can only add business accounts; no fallback to all types
  const allCandidates = candidates;

  // Rank: email/name that *starts with* q floats to the top
  const lq = q.toLowerCase();
  const ranked = allCandidates.sort((a, b) => {
    const aScore =
      (a.email?.toLowerCase().startsWith(lq) ? 3 : 0) +
      (a.name?.toLowerCase().startsWith(lq)   ? 2 : 0) +
      (a.email?.toLowerCase().includes(lq)   ? 1 : 0);
    const bScore =
      (b.email?.toLowerCase().startsWith(lq) ? 3 : 0) +
      (b.name?.toLowerCase().startsWith(lq)   ? 2 : 0) +
      (b.email?.toLowerCase().includes(lq)   ? 1 : 0);
    return bScore - aScore;
  });

  res.json(ranked.slice(0, 8));
  return;
}, "Failed to search accounts"));

// ---------------------------------------------------------------------------
// POST /contacts/from-account/:accountId
// Add a found app account as a contact of the current user.
// Creates a new service-account row (isService: true, ownerId = me) that
// mirrors the target's profile and stores linkedAccountId so updates can be
// reflected later. Also creates the first Conversation thread.
// ---------------------------------------------------------------------------
router.post("/contacts/from-account/:accountId", asyncHandler(async (req, res) => {
  const { accountId } = req.params;

  // Verify the target account exists and is a public account (not someone's private contact)
  const target = await prisma.account.findUnique({
    where: { id: String(accountId) },
    select: {
      id:        true,
      name:      true,
      email:     true,
      picture:   true,
      isService: true,
      ownerId:   true,
      business:  true,
      category:  true,
      phone:     true,
      initials:  true,
      color:     true,
      note:      true,
      description: true,
      businessHoursJson: true,
    },
  });
  if (!target) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  // Reject private service accounts (owned by another user)
  if (target.ownerId !== null) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  // Individuals can only add business accounts
  if (!target.isService) {
    res.status(400).json({ error: "You can only add business accounts as contacts" });
    return;
  }

  // Prevent self-linking
  if (target.id === req.userId!) {
    res.status(400).json({ error: "Cannot add yourself as a contact" });
    return;
  }

  // Prevent duplicate links
  const existing = await prisma.account.findFirst({
    where: { ownerId: req.userId!, linkedAccountId: target.id },
  });
  if (existing) {
    res.status(409).json({ error: "Already in your contacts" });
    return;
  }

  // Ensure the contact has a valid business/email field
  const businessField = target.business ?? target.email;
  if (!businessField) {
    res.status(400).json({ error: "Contact must have a business name or email" });
    return;
  }

  // Derive display initials from name if the target hasn't set them
  const initials = target.initials
    ?? (target.name
         ?.split(" ")
         .slice(0, 2)
         .map((w) => w[0]?.toUpperCase() ?? "")
         .join("") ?? "");

  // Pick a deterministic accent color from a palette when none is set
  const COLORS = ["#ff9b83","#f7ad92","#8fc9b0","#e0b568","#c9a4dd","#7fa8dd","#7fb3d5","#a8c9a8"];
  const color = target.color ?? COLORS[Math.abs(target.id.charCodeAt(0) - 97) % COLORS.length];

  const contact = await prisma.account.create({
    data: {
      isService:       true,
      ownerId:         req.userId!,
      linkedAccountId: target.id,
      name:            target.name,
      business:        businessField,
      category:        target.category ?? "Other",
      phone:           target.phone ?? "",
      initials,
      color,
      note:            target.description ?? target.note,
      online:          false,
      conversations: {
        create: { title: `Chat with ${target.name}` },
      },
    },
    include: { conversations: true },
  });

  // If the business has already saved this individual, queue the intro call. Never blocks or fails the add.
  void queueIntroCall(req.userId!, target.id);

  res.status(201).json(contact);
  return;
}, "Failed to add contact from account"));
router.get("/contacts", asyncHandler(async (req, res) => {
  const { category } = req.query;
  const contacts = await prisma.account.findMany({
    where: {
      ownerId:   req.userId!,
      isService: true,
      ...(category ? { category: String(category) } : {}),
    },
    select: {
      id: true,
      name: true,
      business: true,
      category: true,
      phone: true,
      contactEmail: true,
      allowFallbackMessage: true,
      initials: true,
      color: true,
      note: true,
      description: true,
      businessHoursJson: true,
      timezone: true,
      online: true,
      linkedAccountId: true,
      createdAt: true,
      updatedAt: true,
      conversations: {
        select: { id: true, title: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Load owner's timezone
  const owner = await prisma.account.findUnique({
    where: { id: req.userId! },
    select: { timezone: true },
  });
  const ownerTz = owner?.timezone || process.env.DEFAULT_TIMEZONE || "UTC";

  // Load linked business accounts once
  const linkedIds = [...new Set(contacts.map(c => c.linkedAccountId).filter(Boolean))] as string[];
  const linked = await prisma.account.findMany({
    where: { id: { in: linkedIds } },
    select: { id: true, businessHoursJson: true, timezone: true },
  });
  const linkedMap = new Map(linked.map(a => [a.id, a]));

  // Closures (holidays, out of service) for those businesses, one query
  const now = new Date();
  const closureInfo = await loadClosureInfo(linkedIds, now);

  // Resolve online status, effective hours and closures for each contact
  const contactsWithLiveOnline = contacts.map(contact => {
    const biz = contact.linkedAccountId ? linkedMap.get(contact.linkedAccountId) : undefined;
    const { hours: effectiveHours, source: hoursSource } = resolveEffectiveHours({
      contactJson: contact.businessHoursJson,
      businessJson: biz?.businessHoursJson,
      businessTz: biz?.timezone,
      contactTz: contact.timezone,
      ownerTz,
    });
    return {
      ...contact,
      ...messagingView(contact),
      online: contact.linkedAccountId ? isOnline(contact.linkedAccountId) : contact.online,
      effectiveHours,
      hoursSource,
      ...closureForIndividual(contact.linkedAccountId ? closureInfo.get(contact.linkedAccountId) : undefined, now),
    };
  });

  res.json(contactsWithLiveOnline);
  return;
}, "Failed to fetch contacts"));

// Create a new service account (contact).
// If `withConversation` is truthy, also creates the first chat thread.
router.post("/contacts", asyncHandler(async (req, res) => {
  const { name, business, category, phone, initials, color, note, withConversation } = req.body;
  const email = parseContactEmail(req.body.contactEmail);
  const allow = parseAllowFallback(req.body.allowFallbackMessage);
  if (!email.ok || !allow.ok) {
    res.status(400).json({ error: (!email.ok ? email.error : !allow.ok ? allow.error : "") });
    return;
  }
  if (allow.value && !hasUsableChannel(email.value, phone)) {
    res.status(400).json({ error: NO_CHANNEL_ERROR });
    return;
  }

  // Validate required fields
  if (!name) {
    res.status(400).json({ error: "Name is required" });
    return;
  }

  if (!business) {
    res.status(400).json({ error: "Business name or email is required" });
    return;
  }

  const contact = await prisma.account.create({
    data: {
      isService: true,
      ownerId:   req.userId!,
      name,
      business,
      category,
      phone,
      ...(email.value !== undefined ? { contactEmail: email.value } : {}),
      ...(allow.value !== undefined ? { allowFallbackMessage: allow.value } : {}),
      initials,
      color,
      note,
      online: false, // Always start as offline, presence system will update this
      ...(withConversation
        ? { conversations: { create: { title: `Chat with ${name}` } } }
        : {}),
    },
    include: { conversations: true },
  });
  res.json(messagingView(contact));
  return;
}, "Failed to create contact"));

// Get the active conversation for a contact
router.get("/contacts/:id/conversation", asyncHandler(async (req, res) => {
  const { id } = req.params;
  // Verify contact belongs to this login account
  const contact = await prisma.account.findFirst({
    where: { id: String(id), ownerId: req.userId!, isService: true },
  });
  if (!contact) {
    res.status(404).json({ error: "Contact not found" });
    return;
  }
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
    res.status(404).json({ error: "No conversation found for this contact" });
    return;
  }
  res.json(conversation);
  return;
}, "Failed to fetch contact conversation"));

// Update a contact
router.put("/contacts/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, business, category, phone, initials, color, note, businessHoursJson } = req.body;
  const email = parseContactEmail(req.body.contactEmail);
  const allow = parseAllowFallback(req.body.allowFallbackMessage);
  if (!email.ok || !allow.ok) {
    res.status(400).json({ error: (!email.ok ? email.error : !allow.ok ? allow.error : "") });
    return;
  }
  // Verify ownership before update
  const existing = await prisma.account.findFirst({
    where: { id: String(id), ownerId: req.userId!, isService: true },
    select: {
      id: true,
      phone: true,
      contactEmail: true,
      allowFallbackMessage: true,
      businessHoursJson: true,
      timezone: true,
      linkedAccountId: true,
    },
  });
  if (!existing) {
    res.status(404).json({ error: "Contact not found" });
    return;
  }

  // Judge the result of the update, not just the request: clearing the only channel while messaging
  // stays on (or turning it on with no channel) is refused.
  const nextEmail = email.value !== undefined ? email.value : existing.contactEmail;
  const nextPhone = phone !== undefined ? phone : existing.phone;
  const nextAllow = allow.value !== undefined ? allow.value : existing.allowFallbackMessage;
  if (nextAllow && !hasUsableChannel(nextEmail, nextPhone)) {
    res.status(400).json({ error: NO_CHANNEL_ERROR });
    return;
  }

  let businessHoursValue: string | null | undefined = undefined;
  if (businessHoursJson !== undefined) {
    if (businessHoursJson === null) {
      businessHoursValue = null;
    } else {
      try {
        businessHoursValue = JSON.stringify(validateBusinessHours(businessHoursJson));
      } catch (e) {
        res.status(400).json({ error: (e as Error).message });
        return;
      }
    }
  }

  const contact = await prisma.account.update({
    where: { id: String(id) },
    data: {
      name,
      business,
      category,
      phone,
      ...(email.value !== undefined ? { contactEmail: email.value } : {}),
      ...(allow.value !== undefined ? { allowFallbackMessage: allow.value } : {}),
      initials,
      color,
      note,
      ...(businessHoursValue !== undefined ? { businessHoursJson: businessHoursValue } : {}),
    },
    select: {
      id: true,
      name: true,
      business: true,
      category: true,
      phone: true,
      contactEmail: true,
      allowFallbackMessage: true,
      initials: true,
      color: true,
      note: true,
      description: true,
      businessHoursJson: true,
      timezone: true,
      linkedAccountId: true,
    },
  });

  // Load owner's timezone
  const owner = await prisma.account.findUnique({
    where: { id: req.userId! },
    select: { timezone: true },
  });
  const ownerTz = owner?.timezone || process.env.DEFAULT_TIMEZONE || "UTC";

  // Load linked business account
  const biz = existing.linkedAccountId
    ? await prisma.account.findUnique({
        where: { id: existing.linkedAccountId },
        select: { businessHoursJson: true, timezone: true },
      })
    : undefined;

  // Resolve effective hours
  const { hours: effectiveHours, source: hoursSource } = resolveEffectiveHours({
    contactJson: contact.businessHoursJson,
    businessJson: biz?.businessHoursJson,
    businessTz: biz?.timezone,
    contactTz: contact.timezone,
    ownerTz,
  });

  const now = new Date();
  const closureInfo = existing.linkedAccountId
    ? (await loadClosureInfo([existing.linkedAccountId], now)).get(existing.linkedAccountId)
    : undefined;

  res.json({ ...messagingView(contact), effectiveHours, hoursSource, ...closureForIndividual(closureInfo, now) });
  return;
}, "Failed to update contact"));

// Delete a contact (cascades to conversations, tasks, knowledge, etc.)
router.delete("/contacts/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  // Verify ownership before delete
  const existing = await prisma.account.findFirst({
    where: { id: String(id), ownerId: req.userId!, isService: true },
  });
  if (!existing) {
    res.status(404).json({ error: "Contact not found" });
    return;
  }
  if (existing.linkedAccountId) await cancelIntroCall(req.userId!, existing.linkedAccountId);
  await prisma.account.delete({ where: { id: String(id) } });
  res.json({ success: true });
  return;
}, "Failed to delete contact"));

export default router;