/**
 * Shared Gemini text generation used for both the demo chat
 * (routes/gemini.ts) and email auto-replies (services/emailReply.ts). Kept
 * as one place so model fallback behavior stays consistent across channels.
 */

const REQUESTED_MODEL = "gemini-3.5-flash-lite";
const COMPATIBLE_MODEL = "gemini-2.5-flash";

function modelUrl(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

export type GeminiTextTurn = { role: "user" | "assistant"; content: string };

export async function generateGeminiText(params: {
  systemInstructionText: string;
  turns: GeminiTextTurn[];
}): Promise<{ text: string; model: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  if (apiKey === "test_key" || apiKey === "test_key_for_testing") {
    return { text: "This is a test response from the Phone Agent.", model: "test-mock" };
  }

  const contents = params.turns.map((t) => ({
    role: t.role === "assistant" ? "model" : "user",
    parts: [{ text: t.content }],
  }));
  const systemInstruction = { parts: [{ text: params.systemInstructionText }] };
  const generationConfig = { temperature: 0.7, maxOutputTokens: 8192 };

  async function request(model: string) {
    return fetch(`${modelUrl(model)}?key=${encodeURIComponent(apiKey!)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents, systemInstruction, generationConfig }),
    });
  }

  let response = await request(REQUESTED_MODEL);
  let modelUsed = REQUESTED_MODEL;
  if (!response.ok && response.status === 404) {
    response = await request(COMPATIBLE_MODEL);
    modelUsed = COMPATIBLE_MODEL;
  }

  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Gemini request failed (${response.status})`);
  }

  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return { text, model: modelUsed };
}
