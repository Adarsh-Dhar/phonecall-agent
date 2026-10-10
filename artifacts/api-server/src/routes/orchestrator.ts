import { Router, type IRouter } from "express";
import { prisma } from "@workspace/db-prisma";
import {
  generateOrchestratorText,
  getNebiusConfig,
  NebiusApiError,
  OrchestratorEmptyResponseError,
} from "../services/nebiusText";
import { buildDemoChatSystemPrompt } from "../services/demoChatPrompt";
import "../lib/authMiddleware"; // Import to ensure Request type augmentation is applied

const router: IRouter = Router();

// Demo chat runs on the orchestrator's text model (Nebius Token Factory,
// NVIDIA open model) — not the live voice call, which stays on Gemini Live.
// All Nebius access (URL, key, model, fallback) lives in services/nebiusText.ts.

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

// Route path kept as /gemini/chat for frontend/API compatibility even though
// the implementation now runs on Nebius — see lib/api/orchestrator.ts on the
// frontend, which still targets this same path.
router.post("/gemini/chat", async (req, res) => {
  const { apiKey, model: requestedModel } = getNebiusConfig();
  const messages = req.body?.messages as ChatMessage[] | undefined;
  const contactId = req.body?.contactId as string | undefined;

  if (!apiKey) {
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
    const { text, model } = await generateOrchestratorText({
      systemInstructionText: systemContent,
      turns: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    res.json({ message: text, model, requestedModel });
  } catch (error) {
    if (error instanceof OrchestratorEmptyResponseError) {
      res.status(502).json({ error: "Orchestrator returned an empty response.", model: requestedModel });
      return;
    }

    if (error instanceof NebiusApiError) {
      req.log.error({ status: error.status, modelUsed: error.model }, "Orchestrator request failed");
      res.status(502).json({
        error: error.message || "Orchestrator could not answer right now.",
        model: error.model,
      });
      return;
    }

    req.log.error({ err: error }, "Orchestrator request could not be completed");
    res.status(502).json({ error: "Could not reach the orchestrator right now." });
  }
});

export default router;
