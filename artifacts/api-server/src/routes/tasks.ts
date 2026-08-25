import { Router, type IRouter } from "express";
import { prisma } from "@workspace/db-prisma";
import { runExtraction } from "../services/taskExtraction";
import { asyncHandler } from "../lib/asyncHandler";
import { sourcesInclude, contactCardSelect } from "../lib/prismaSelects";

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// GET /conversations/:id/tasks
// Tasks for a single conversation thread
// ---------------------------------------------------------------------------
router.get("/conversations/:id/tasks", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.query;

  const tasks = await prisma.task.findMany({
    where: {
      conversationId: String(id),
      ...(status ? { status: String(status) } : {}),
    },
    include: sourcesInclude,
    orderBy: { createdAt: "asc" },
  });

  res.json(tasks);
}, "Failed to fetch conversation tasks"));

// ---------------------------------------------------------------------------
// GET /contacts/:id/tasks
// All tasks for a contact across all their conversation threads
// ---------------------------------------------------------------------------
router.get("/contacts/:id/tasks", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.query;

  const tasks = await prisma.task.findMany({
    where: {
      contactId: String(id),
      ...(status ? { status: String(status) } : {}),
    },
    include: sourcesInclude,
    orderBy: { createdAt: "desc" },
  });

  res.json(tasks);
}, "Failed to fetch contact tasks"));

// ---------------------------------------------------------------------------
// GET /tasks
// Global task inbox — cross-contact, filterable by status / priority / contactId
// e.g. GET /tasks?status=open&priority=high
// ---------------------------------------------------------------------------
router.get("/tasks", asyncHandler(async (req, res) => {
  const { status, priority, contactId } = req.query;

  const tasks = await prisma.task.findMany({
    where: {
      ...(status ? { status: String(status) } : {}),
      ...(priority ? { priority: String(priority) } : {}),
      ...(contactId ? { contactId: String(contactId) } : {}),
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
// Body: { title, description?, dueDate?, priority?, conversationId, contactId }
// ---------------------------------------------------------------------------
router.post("/tasks", asyncHandler(async (req, res) => {
  const { title, description, dueDate, priority, conversationId, contactId } = req.body;

  if (!title || !conversationId || !contactId) {
    res.status(400).json({ error: "title, conversationId, and contactId are required" });
    return;
  }

  const task = await prisma.task.create({
    data: {
      title,
      description: description ?? null,
      dueDate: dueDate ? new Date(dueDate) : null,
      priority: priority ?? "normal",
      status: "open",          // user-created tasks skip "suggested"
      source: "user",
      confidence: 1.0,
      conversationId,
      contactId,
    },
    include: sourcesInclude,
  });

  res.status(201).json(task);
}, "Failed to create task"));

// ---------------------------------------------------------------------------
// PATCH /tasks/:id
// User edits a task: status, title, description, dueDate, priority
// Automatically sets completedAt when status transitions to "done"
// ---------------------------------------------------------------------------
router.patch("/tasks/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, title, description, dueDate, priority } = req.body;

  const existing = await prisma.task.findUnique({ where: { id: String(id) } });
  if (!existing) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  const isCompleting = status === "done" && existing.status !== "done";

  const task = await prisma.task.update({
    where: { id: String(id) },
    data: {
      ...(status !== undefined ? { status } : {}),
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
      ...(priority !== undefined ? { priority } : {}),
      ...(isCompleting ? { completedAt: new Date() } : {}),
    },
    include: sourcesInclude,
  });

  res.json(task);
}, "Failed to update task"));

// ---------------------------------------------------------------------------
// POST /conversations/:id/extract
// Manual "extract now" — bypasses debounce. Useful for the UI "Check for tasks"
// button or for backfilling old conversations.
// ---------------------------------------------------------------------------
router.post("/conversations/:id/extract", asyncHandler(async (req, res) => {
  const { id } = req.params;

  const conversation = await prisma.conversation.findUnique({ where: { id: String(id) } });
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const result = await runExtraction(String(id));
  res.json({ ok: true, ...result });
}, "Extraction failed"));

export default router;
