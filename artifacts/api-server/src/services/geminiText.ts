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
  jsonResponse?: boolean;
}): Promise<{ text: string; model: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const contents = params.turns.map((t) => ({
    role: t.role === "assistant" ? "model" : "user",
    parts: [{ text: t.content }],
  }));

  // The generateContent API rejects a request whose content ends on a
  // "model" turn ("Requests ending with a model turn are not supported.").
  // Any transcript that ends with the agent's side of the conversation
  // (e.g. a call transcript ending in the agent's goodbye) hits this every
  // time, so append a synthetic trailing user turn to keep the request valid
  // regardless of how the underlying conversation actually ended.
  if (contents.length > 0 && contents[contents.length - 1].role === "model") {
    contents.push({
      role: "user",
      parts: [{ text: "(End of transcript. Respond now, following the instructions above.)" }],
    });
  }

  const systemInstruction = { parts: [{ text: params.systemInstructionText }] };
  const generationConfig: { temperature: number; maxOutputTokens: number; responseMimeType?: string } = {
    temperature: 0.7,
    maxOutputTokens: 8192,
  };
  if (params.jsonResponse) {
    generationConfig.responseMimeType = "application/json";
  }

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
