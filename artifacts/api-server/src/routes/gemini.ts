import { Router, type IRouter } from "express";
import { prisma } from "@workspace/db-prisma";

const router: IRouter = Router();

const REQUESTED_MODEL = "gemini-3.5-flash-lite";
const COMPATIBLE_MODEL = "gemini-2.5-flash";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function modelUrl(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

router.post("/gemini/chat", async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const messages = req.body?.messages as ChatMessage[] | undefined;
  const contactId = req.body?.contactId as string | undefined;

  if (!apiKey) {
    res.status(503).json({ error: "Gemini is not configured yet." });
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

  const contents = messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));
  const systemInstruction = {
    parts: [
      {
        text:
          "You are Phone Agent, a concise and thoughtful personal admin assistant. " +
          "Help the user turn everyday tasks into clear next steps. " +
          "Ask a question ONLY when information you genuinely need is missing or ambiguous. " +
          "Use what you already know about the contact (below) to skip questions you don't need to ask. " +
          "Once the user has given you everything required for the task (day, time, or any other detail you asked for), " +
          "do not ask another confirming question — proceed immediately: state the booking/action as done, " +
          "using the word 'simulated' or 'noted' once if you like, and stop there. " +
          "Never ask 'shall I go ahead?' after the user has already told you to go ahead or has already answered your question. " +
          "This is a demo app — you don't actually place real bookings, but you should describe the outcome as settled, not pending." +
          knowledgeBlock,
      },
    ],
  };
  const generationConfig = { temperature: 0.7, maxOutputTokens: 8192 };

  async function request(model: string) {
    return fetch(`${modelUrl(model)}?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents, systemInstruction, generationConfig }),
    });
  }

  try {
    let response = await request(REQUESTED_MODEL);
    let modelUsed = REQUESTED_MODEL;

    // Keep the requested model as the first choice, but remain usable when
    // Google's API has not exposed that model name to the supplied key.
    if (!response.ok && response.status === 404) {
      response = await request(COMPATIBLE_MODEL);
      modelUsed = COMPATIBLE_MODEL;
    }

    const payload = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      error?: { message?: string };
    };

    if (!response.ok) {
      req.log.error({ status: response.status, modelUsed }, "Gemini request failed");
      res.status(502).json({
        error: payload.error?.message ?? "Gemini could not answer right now.",
        model: modelUsed,
      });
      return;
    }

    const text = payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim();

    if (!text) {
      res.status(502).json({ error: "Gemini returned an empty response.", model: modelUsed });
      return;
    }

    res.json({ message: text, model: modelUsed, requestedModel: REQUESTED_MODEL });
  } catch (error) {
    req.log.error({ err: error }, "Gemini request could not be completed");
    res.status(502).json({ error: "Could not reach Gemini right now." });
  }
});

export default router;