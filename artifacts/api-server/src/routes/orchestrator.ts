import { Router, type IRouter } from "express";
import { prisma } from "@workspace/db-prisma";
import { callNebiusChat, NebiusApiError } from "../services/nebiusText";
import { buildDemoChatSystemPrompt } from "../services/demoChatPrompt";
import { loadOwnerInfo, buildOwnerInfoBlock } from "../services/ownerInfo";
import { scheduleExtraction } from "../services/taskExtraction";
import "../lib/authMiddleware"; // Import to ensure Request type augmentation is applied

const router: IRouter = Router();

// Demo chat runs on the orchestrator's text model (Nebius Token Factory,
// NVIDIA open model) — not the live voice call, which stays on Gemini Live.
// All calls go through services/nebiusText.ts (timeouts, retries, fallback, metrics).

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

// Mounted under /api/orchestrator (see routes/index.ts), so the full path is
// /api/orchestrator/chat — the frontend (lib/api/orchestrator.ts) calls
// exactly that.
router.post("/chat", async (req, res) => {
  const messages = req.body?.messages as ChatMessage[] | undefined;
  let contactId = req.body?.contactId as string | undefined;

  // If contactId is not provided in the request body, try to extract it from the Referer header
  // This handles cases where the chat UI doesn't explicitly pass contactId but the user is on a contact page
  if (!contactId && req.headers.referer) {
    const referer = req.headers.referer;
    const contactMatch = referer.match(/\/contacts\/([a-zA-Z0-9]+)/);
    if (contactMatch && contactMatch[1]) {
      contactId = contactMatch[1];
    }
  }

  if (!process.env.NEBIUS_API_KEY) {
    res.status(503).json({ error: "Orchestrator is not configured yet." });
    return;
  }

  if (
    !Array.isArray(messages) ||
    messages.length === 0 ||
    messages.some(
      (message) =>
        !message ||
        !["user", "assistant"].includes(message.role) ||
        typeof message.content !== "string" ||
        !message.content.trim(),
    )
  ) {
    res.status(400).json({ error: "messages must be a non-empty chat history." });
    return;
  }

  // If no contactId, respond without persistence (demo mode)
  if (!contactId) {
    const ownerInfo = await loadOwnerInfo(req.userId!);
    const user = await prisma.account.findUnique({
      where: { id: req.userId! },
      select: { name: true },
    });
    const ownerInfoBlock = user ? buildOwnerInfoBlock(user.name || '', ownerInfo) : '';
    const systemContent = buildDemoChatSystemPrompt('', ownerInfoBlock);

    try {
      const { text, model } = await callNebiusChat({
        purpose: "demo_chat",
        messages: [
          { role: "system", content: systemContent },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
        temperature: 0.7,
        maxTokens: 1024,
      });
      res.json({ message: text, model });
    } catch (error) {
      req.log.error({ err: error }, "Orchestrator request failed");
      const message = error instanceof NebiusApiError ? error.message : "Could not reach the orchestrator right now.";
      res.status(502).json({ error: message });
    }
    return;
  }

  // Verify the contact belongs to this user
  const contact = await prisma.account.findFirst({
    where: { id: contactId, ownerId: req.userId! },
  });
  if (!contact) {
    res.status(404).json({ error: "Contact not found" });
    return;
  }

  // Find or create conversation for this contact
  let conversation = await prisma.conversation.findFirst({
    where: { contactId },
  });
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { title: `Chat with ${contact.name}`, contactId },
    });
  }

  // Build knowledge block from durable facts about this contact
  const facts = await prisma.contactKnowledge.findMany({
    where: { contactId, status: "active" },
    orderBy: { category: "asc" },
  });
  const knowledgeBlock = facts.length > 0
    ? "\n\nWhat you already know about this contact:\n" +
      facts.map((f) => `- (${f.category}) ${f.key}: ${f.value}`).join("\n")
    : "";

  // Load contact's tasks/appointments
  const tasks = await prisma.task.findMany({
    where: { 
      contactId
    },
    orderBy: { dueDate: "asc" },
  });
  const tasksBlock = tasks.length > 0
    ? "\n\nCurrent tasks and appointments for this contact:\n" +
      tasks.map((t) => {
        const dateStr = t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "No date set";
        const kindLabel = t.kind === 'appointment' ? 'Appointment' : t.kind === 'bring' ? 'Bring' : 'Task';
        return `- ${kindLabel}: ${t.title || t.description || '(no title)'} (${dateStr})`;
      }).join("\n")
    : "\n\nNo tasks or appointments currently scheduled for this contact.";

  // Load owner info and build the block
  const ownerInfo = await loadOwnerInfo(req.userId!);
  const user = await prisma.account.findUnique({
    where: { id: req.userId! },
    select: { name: true },
  });
  const ownerInfoBlock = user ? buildOwnerInfoBlock(user.name || '', ownerInfo) : '';

  const systemContent = buildDemoChatSystemPrompt(knowledgeBlock + tasksBlock, ownerInfoBlock);

  try {
    // Persist the last user message
    const lastUserMessage = messages.filter(m => m.role === "user").pop();
    if (lastUserMessage) {
      await prisma.message.create({
        data: {
          role: "user",
          content: lastUserMessage.content,
          conversationId: conversation.id,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      });
    }

    const { text, model } = await callNebiusChat({
      purpose: "demo_chat",
      messages: [
        { role: "system", content: systemContent },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      temperature: 0.7,
      maxTokens: 4096,
    });

    // Persist the assistant response
    await prisma.message.create({
      data: {
        role: "assistant",
        content: text,
        conversationId: conversation.id,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    // Trigger task extraction so appointment requests create calendar events
    scheduleExtraction(conversation.id);

    res.json({ message: text, model });
  } catch (error) {
    req.log.error({ err: error }, "Orchestrator request failed");
    const message = error instanceof NebiusApiError ? error.message : "Could not reach the orchestrator right now.";
    res.status(502).json({ error: message });
  }
});

export default router;
