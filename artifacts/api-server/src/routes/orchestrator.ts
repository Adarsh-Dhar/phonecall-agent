import { Router, type IRouter } from "express";
import { prisma } from "@workspace/db-prisma";
import "../lib/authMiddleware"; // Import to ensure Request type augmentation is applied

const router: IRouter = Router();

// Demo chat runs on the orchestrator's text model (Nebius Token Factory,
// NVIDIA open model) — not the live voice call, which stays on Gemini Live.
// See services/nebiusText.ts for the shared version of this pattern.
const REQUESTED_MODEL = process.env.NEBIUS_MODEL ?? "nvidia/llama-3_1-nemotron-ultra-253b-v1";
const COMPATIBLE_MODEL = "meta-llama/Llama-3.3-70B-Instruct-fast";
const BASE_URL = (process.env.NEBIUS_BASE_URL ?? "https://api.tokenfactory.nebius.com/v1").replace(/\/+$/, "");

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function chatCompletionsUrl() {
  return `${BASE_URL}/chat/completions`;
}

// Route path kept as /gemini/chat for frontend/API compatibility even though
// the implementation now runs on Nebius — see lib/api/orchestrator.ts on the
// frontend, which still targets this same path.
router.post("/gemini/chat", async (req, res) => {
  const apiKey = process.env.NEBIUS_API_KEY;
  const messages = req.body?.messages as ChatMessage[] | undefined;
  const contactId = req.body?.contactId as string | undefined;

  if (!apiKey) {
    res.status(503).json({ error: "Orchestrator is not configured yet." });
    return;
  }

  const key = apiKey;

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

  const systemContent =
    "You are Phone Agent, a concise and thoughtful personal admin assistant. " +
    "Help the user turn everyday tasks into clear next steps. " +
    "Ask a question ONLY when information you genuinely need is missing or ambiguous. " +
    "Use what you already know about the contact (below) to skip questions you don't need to ask. " +
    "Once the user has given you everything required for the task (day, time, or any other detail you asked for), " +
    "do not ask another confirming question — proceed immediately: state the booking/action as done, " +
    "using the word 'simulated' or 'noted' once if you like, and stop there. " +
    "Never ask 'shall I go ahead?' after the user has already told you to go ahead or has already answered your question. " +
    "This is a demo app — you don't actually place real bookings, but you should describe the outcome as settled, not pending." +
    knowledgeBlock;

  const chatMessages = [
    { role: "system" as const, content: systemContent },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  async function request(model: string) {
    return fetch(chatCompletionsUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 8192,
      }),
    });
  }

  try {
    let response = await request(REQUESTED_MODEL);
    let modelUsed = REQUESTED_MODEL;

    // Keep the requested model as the first choice, but fall back when the
    // account/key doesn't have that model enabled.
    if (!response.ok && (response.status === 404 || response.status === 400)) {
      response = await request(COMPATIBLE_MODEL);
      modelUsed = COMPATIBLE_MODEL;
    }

    const payload = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string | null;
          // Some Nemotron reasoning models put the answer here instead of
          // `content` when left in their default reasoning mode.
          reasoning_content?: string | null;
        };
      }>;
      error?: { message?: string } | string;
    };

    if (!response.ok) {
      req.log.error({ status: response.status, modelUsed }, "Orchestrator request failed");
      const message = typeof payload.error === "string" ? payload.error : payload.error?.message;
      res.status(502).json({
        error: message ?? "Orchestrator could not answer right now.",
        model: modelUsed,
      });
      return;
    }

    const message = payload.choices?.[0]?.message;
    const text = (message?.content || message?.reasoning_content || "").trim();

    if (!text) {
      res.status(502).json({ error: "Orchestrator returned an empty response.", model: modelUsed });
      return;
    }

    res.json({ message: text, model: modelUsed, requestedModel: REQUESTED_MODEL });
  } catch (error) {
    req.log.error({ err: error }, "Orchestrator request could not be completed");
    res.status(502).json({ error: "Could not reach the orchestrator right now." });
  }
});

export default router;
