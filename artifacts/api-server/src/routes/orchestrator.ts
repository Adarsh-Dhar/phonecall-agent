import { Router, type IRouter } from "express";
import { prisma } from "@workspace/db-prisma";
import { callNebiusChat, NebiusError } from "../services/nebiusText";
import { buildDemoChatSystemPrompt } from "../services/demoChatPrompt";
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
// /api/orchestrator/gemini/chat — the frontend (lib/api/orchestrator.ts) calls
// exactly that. The "gemini" segment is a legacy name; the model is Nebius.
router.post("/gemini/chat", async (req, res) => {
  const messages = req.body?.messages as ChatMessage[] | undefined;
  const contactId = req.body?.contactId as string | undefined;

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

  // Build knowledge block from durable facts about this contact
  let knowledgeBlock = "";
  if (contactId) {
    // Verify the contact (service account) belongs to this user
    const contact = await prisma.account.findFirst({
      where: { id: contactId, ownerId: req.userId!, isService: true },
    });
    if (!contact) {
      res.status(404).json({ error: "Contact not found" });
      return;
    }

    const facts = await prisma.contactKnowledge.findMany({
      where: { contactId, status: "active" },
      orderBy: { category: "asc" },
    });
    if (facts.length > 0) {
      knowledgeBlock =
        "\n\nWhat you already know about this contact:\n" +
        facts.map((f) => `- (${f.category}) ${f.key}: ${f.value}`).join("\n");
    }
  }

  const systemContent = buildDemoChatSystemPrompt(knowledgeBlock);

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
    const message = error instanceof NebiusError ? error.message : "Could not reach the orchestrator right now.";
    res.status(502).json({ error: message });
  }
});

export default router;
