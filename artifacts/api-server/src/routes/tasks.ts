import { Router, type IRouter } from "express";
import { prisma } from "@workspace/db-prisma";
import { syncTaskToCalendar } from "../services/googleCalendar";
import { nudgeScheduler } from "../services/callScheduler";
import { asyncHandler } from "../lib/asyncHandler";
import { sourcesInclude, contactCardSelect } from "../lib/prismaSelects";
import { normalizeKind, sanitizeMeta, firstFireAt, syncsToCalendar } from "../services/taskKinds";
import type { Prisma } from "@workspace/db-prisma";

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// GET /contacts/:id/tasks
// All tasks for a contact across all their conversation threads
// ---------------------------------------------------------------------------
router.get("/contacts/:id/tasks", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, kind } = req.query;

  // Verify contact belongs to user
  const contact = await prisma.account.findFirst({
    where: { id: String(id), ownerId: req.userId! },
  });
  if (!contact) {
    res.status(404).json({ error: "Contact not found" });
    return;
  }

  const tasks = await prisma.task.findMany({
    where: {
      contactId: String(id),
      ...(status ? { status: String(status) } : {}),
      ...(kind ? { kind: { in: String(kind).split(",") } } : {}),
    },
    include: sourcesInclude,
    orderBy: { createdAt: "desc" },
  });

  res.json(tasks);
}, "Failed to fetch contact tasks"));

// ---------------------------------------------------------------------------
// GET /tasks
// Global task inbox — cross-contact, filterable by status / priority / contactId / kind
// e.g. GET /tasks?status=open&priority=high&kind=appointment,bring
// ---------------------------------------------------------------------------
router.get("/", asyncHandler(async (req, res) => {
  const { status, priority, contactId, kind } = req.query;

  const tasks = await prisma.task.findMany({
    where: {
      contact: { ownerId: req.userId! },
      ...(status    ? { status: String(status) }       : {}),
      ...(priority ? { priority: String(priority) }   : {}),
      ...(contactId ? { contactId: String(contactId) } : {}),
      ...(kind      ? { kind: { in: String(kind).split(",") } } : {}),
    },
    include: {
      ...sourcesInclude,
      contact: { select: contactCardSelect },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
  });

  res.json(tasks);
}, "Failed to fetch tasks"));

// ---------------------------------------------------------------------------
// POST /tasks
// Manual task creation — source: "user", skips "suggested", goes to "open"
// Body: { title, description?, dueDate?, priority?, kind?, conversationId, contactId, meta?, parentTaskId? }
// ---------------------------------------------------------------------------
router.post("/", asyncHandler(async (req, res) => {
  const { title, description, dueDate, priority, kind, conversationId, contactId, meta, parentTaskId } = req.body;

  if (!title || !conversationId || !contactId) {
    res.status(400).json({ error: "title, conversationId, and contactId are required" });
    return;
  }

  // Verify contact belongs to this user
  const contact = await prisma.account.findFirst({
    where: { id: String(contactId), ownerId: req.userId! },
    select: { id: true, ownerId: true, name: true, business: true },
  });
  if (!contact) {
    res.status(404).json({ error: "Contact not found" });
    return;
  }

  // Load owner for timezone
  const owner = await prisma.account.findUnique({
    where: { id: contact.ownerId ?? "" },
    select: { timezone: true },
  });
  const ownerTz = owner?.timezone ?? "UTC";

  const k = normalizeKind(kind ?? "call");
  const due = dueDate ? new Date(dueDate) : null;
  if (due && Number.isNaN(due.getTime())) {
    res.status(400).json({ error: "Invalid dueDate" });
    return;
  }

  const sanitizedMeta = sanitizeMeta(k, meta) as any;

  // Prevent duplicate tasks: check for existing task with same title, contact, and due date
  const existingTask = await prisma.task.findFirst({
    where: {
      title,
      contactId,
      status: { not: "cancelled" },
      ...(due ? { dueDate: due } : {}),
    },
  });
  if (existingTask) {
    res.status(409).json({ error: "A task with this title and due date already exists for this contact" });
    return;
  }

  const task = await prisma.task.create({
    data: {
      title,
      description: description ?? null,
      dueDate:     due,
      priority:    priority ?? "normal",
      kind:        k,
      meta:        sanitizedMeta,
      parentTaskId: parentTaskId ?? undefined,
      status:      "open",   // user-created tasks skip "suggested"
      source:      "user",
      confidence:  1.0,
      conversationId,
      contactId,
      nextAttemptAt: firstFireAt(k, due, ownerTz),
      callAttempts: 0,
      schedulerStatus: "pending",
    },
    include: { ...sourcesInclude, contact: true },
  });

  // Arm the exact-time wake-up so a task due in the next few seconds fires on time.
  if (task.dueDate) nudgeScheduler();

  // Sync to Google Calendar (non-blocking)
  if (due && syncsToCalendar(k)) {
    syncTaskToCalendar({
      id:           task.id,
      title:        task.title,
      description:  task.description,
      dueDate:      task.dueDate,
      status:       task.status,
      googleEventId: task.googleEventId,
      kind:         task.kind,
      meta:         task.meta as any,
      contact:      { name: contact.name || '', business: contact.business || '' },
      userId:       req.userId!,
    }).catch((err) => {
      console.error("Failed to sync task to calendar:", err);
    });
  }

  res.status(201).json(task);
}, "Failed to create task"));

// ---------------------------------------------------------------------------
// PATCH /:id
// User edits a task: status, title, description, dueDate, priority, kind
// Automatically sets completedAt when status transitions to "done"
// ---------------------------------------------------------------------------
router.patch("/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, title, description, dueDate, priority, kind, meta } = req.body;

  const existing = await prisma.task.findFirst({
    where: { id: String(id), contact: { ownerId: req.userId! } },
    include: { contact: true },
  });

  if (!existing) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  // Load owner for timezone
  const owner = await prisma.account.findUnique({
    where: { id: existing.contact.ownerId ?? "" },
    select: { timezone: true },
  });
  const ownerTz = owner?.timezone ?? "UTC";

  const isCompleting = status === "done" && existing.status !== "done";
  const isCancelling = status === "cancelled" && existing.status !== "cancelled";
  const dueDateChanged = dueDate !== undefined && existing.dueDate?.getTime() !== (dueDate ? new Date(dueDate).getTime() : null);
  const kindChanged = kind !== undefined && existing.kind !== kind;

  const effectiveKind = kind ?? existing.kind;
  const effectiveDue = dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : existing.dueDate;

  const updateData: any = {
    ...(status      !== undefined ? { status }                               : {}),
    ...(title       !== undefined ? { title }                                : {}),
    ...(description !== undefined ? { description }                          : {}),
    ...(priority    !== undefined ? { priority }                             : {}),
    ...(kind        !== undefined ? { kind }                                 : {}),
    ...(meta        !== undefined ? { meta: sanitizeMeta(effectiveKind, meta) } : {}),
    ...(isCompleting              ? { completedAt: new Date() }              : {}),
  };

  // Handle dueDate or kind changes with scheduler re-arm
  if (dueDateChanged || kindChanged) {
    updateData.dueDate = effectiveDue;
    updateData.nextAttemptAt = firstFireAt(effectiveKind, effectiveDue, ownerTz);
    updateData.callAttempts = 0;
    updateData.schedulerStatus = "pending";
  }

  // Handle completion/cancellation
  if (isCompleting || isCancelling) {
    updateData.schedulerStatus = "done";
  }

  const task = await prisma.task.update({
    where: { id: String(id) },
    data: updateData,
    include: { ...sourcesInclude, contact: true },
  });

  if (dueDateChanged || kindChanged) nudgeScheduler();

  // Sync to Google Calendar (non-blocking)
  const shouldSync = dueDate !== undefined || status !== undefined || title !== undefined || kind !== undefined;
  if (shouldSync && syncsToCalendar(effectiveKind)) {
    syncTaskToCalendar({
      id:            task.id,
      title:         task.title,
      description:   task.description,
      dueDate:       task.dueDate,
      status:        task.status,
      googleEventId: task.googleEventId,
      kind:          task.kind,
      meta:          task.meta as Record<string, unknown> | null,
      contact:       { name: task.contact.name || '', business: task.contact.business || '' },
      userId:        req.userId!,
    }).catch((err) => {
      console.error("Failed to sync task to calendar:", err);
    });
  }

  res.json(task);
}, "Failed to update task"));

// ---------------------------------------------------------------------------
// DELETE /:id
// Delete a task completely
// ---------------------------------------------------------------------------
router.delete("/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;

  const task = await prisma.task.findFirst({
    where: { id: String(id), contact: { ownerId: req.userId! } },
    include: { contact: true },
  });

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  // Delete from Google Calendar if synced
  if (task.googleEventId) {
    const { deleteEvent } = await import("../services/googleCalendar");
    await deleteEvent({ id: task.id, googleEventId: task.googleEventId, userId: req.userId! });
  }

  await prisma.task.delete({ where: { id: String(id) } });
  res.json({ success: true });
}, "Failed to delete task"));

export default router;
