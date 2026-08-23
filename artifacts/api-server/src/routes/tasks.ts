import { Router, type IRouter } from "express";
import { prisma } from "../db-prisma";
import { runExtraction } from "../services/taskExtraction";

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// Shared task shape — include source messages for jump-to-context links
// ---------------------------------------------------------------------------

const taskInclude = {
  sources: {
    include: { message: { select: { id: true, role: true, time: true, content: true } } },
    orderBy: { id: "asc" as const },
  },
} as const;

// ---------------------------------------------------------------------------
// GET /conversations/:id/tasks
// Tasks for a single conversation thread
// ---------------------------------------------------------------------------
router.get("/conversations/:id/tasks", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    const tasks = await prisma.task.findMany({
      where: {
        conversationId: id,
        ...(status ? { status: String(status) } : {}),
      },
      include: taskInclude,
      orderBy: { createdAt: "asc" },
    });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch conversation tasks" });
  }
});

// ---------------------------------------------------------------------------
// GET /contacts/:id/tasks
// All tasks for a contact across all their conversation threads
// ---------------------------------------------------------------------------
router.get("/contacts/:id/tasks", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    const tasks = await prisma.task.findMany({
      where: {
        contactId: id,
        ...(status ? { status: String(status) } : {}),
      },
      include: taskInclude,
      orderBy: { createdAt: "desc" },
    });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch contact tasks" });
  }
});

// ---------------------------------------------------------------------------
// GET /tasks
// Global task inbox — cross-contact, filterable by status / priority / contactId
// e.g. GET /tasks?status=open&priority=high
// ---------------------------------------------------------------------------
router.get("/tasks", async (req, res) => {
  try {
    const { status, priority, contactId } = req.query;

    const tasks = await prisma.task.findMany({
      where: {
        ...(status ? { status: String(status) } : {}),
        ...(priority ? { priority: String(priority) } : {}),
        ...(contactId ? { contactId: String(contactId) } : {}),
      },
      include: {
        ...taskInclude,
        contact: { select: { id: true, name: true, business: true, initials: true, color: true } },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// ---------------------------------------------------------------------------
// POST /tasks
// Manual task creation — source: "user", skips "suggested", goes to "open"
// Body: { title, description?, dueDate?, priority?, conversationId, contactId }
// ---------------------------------------------------------------------------
router.post("/tasks", async (req, res) => {
  try {
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
      include: taskInclude,
    });

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: "Failed to create task" });
  }
});

// ---------------------------------------------------------------------------
// PATCH /tasks/:id
// User edits a task: status, title, description, dueDate, priority
// Automatically sets completedAt when status transitions to "done"
// ---------------------------------------------------------------------------
router.patch("/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, title, description, dueDate, priority } = req.body;

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const isCompleting = status === "done" && existing.status !== "done";

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
        ...(priority !== undefined ? { priority } : {}),
        ...(isCompleting ? { completedAt: new Date() } : {}),
      },
      include: taskInclude,
    });

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: "Failed to update task" });
  }
});

// ---------------------------------------------------------------------------
// POST /conversations/:id/extract
// Manual "extract now" — bypasses debounce. Useful for the UI "Check for tasks"
// button or for backfilling old conversations.
// ---------------------------------------------------------------------------
router.post("/conversations/:id/extract", async (req, res) => {
  try {
    const { id } = req.params;

    const conversation = await prisma.conversation.findUnique({ where: { id } });
    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    const result = await runExtraction(id);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ error: "Extraction failed" });
  }
});

export default router;
