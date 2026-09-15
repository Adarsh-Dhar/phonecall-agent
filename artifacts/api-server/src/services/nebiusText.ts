/**
 * Shared orchestrator text generation — every non-voice reasoning call
 * (conversation topic classification/summaries in services/conversations.ts,
 * escalation decisions in services/callAnalysis.ts, and the demo chat route)
 * goes through here. Kept as one place so model fallback and JSON-mode
 * behavior stays consistent across those callers.
 *
 * This runs on Nebius Token Factory's OpenAI-compatible API, on an NVIDIA
 * open model. The live phone call itself is a separate, latency-sensitive
 * path and stays on Gemini Live — see services/geminiVoiceSession.ts.
 */

const REQUESTED_MODEL = process.env.NEBIUS_MODEL ?? "nvidia/llama-3_1-nemotron-ultra-253b-v1";
const COMPATIBLE_MODEL = "meta-llama/Llama-3.3-70B-Instruct-fast";
const BASE_URL = (process.env.NEBIUS_BASE_URL ?? "https://api.tokenfactory.nebius.com/v1").replace(/\/+$/, "");

function chatCompletionsUrl() {
  return `${BASE_URL}/chat/completions`;
}

export type OrchestratorTextTurn = { role: "user" | "assistant"; content: string };

type NebiusMessage = { role: "system" | "user" | "assistant"; content: string };

type NebiusChoice = {
  message?: {
    content?: string | null;
    // Some Nemotron reasoning models return their answer here instead of
    // `content` when the model is left in its default reasoning mode.
    reasoning_content?: string | null;
  };
};

export async function generateOrchestratorText(params: {
  systemInstructionText: string;
  turns: OrchestratorTextTurn[];
  jsonResponse?: boolean;
}): Promise<{ text: string; model: string }> {
  const apiKey = process.env.NEBIUS_API_KEY;
  if (!apiKey) {
    throw new Error("NEBIUS_API_KEY is not configured.");
  }

  const messages: NebiusMessage[] = [
    { role: "system", content: params.systemInstructionText },
    ...params.turns.map((t) => ({ role: t.role, content: t.content }) as NebiusMessage),
  ];

  // Mirror generateGeminiText's guard: some providers reject a request whose
  // history ends on the assistant's own turn. Append a synthetic trailing
  // user turn so a transcript that ends with the agent's side (e.g. its
  // goodbye) never breaks this call.
  if (messages.length > 0 && messages[messages.length - 1].role === "assistant") {
    messages.push({
      role: "user",
      content: "(End of transcript. Respond now, following the instructions above.)",
    });
  }

  async function request(model: string) {
    const body: Record<string, unknown> = {
      model,
      messages,
      temperature: 0.7,
      max_tokens: 8192,
    };
    if (params.jsonResponse) {
      body.response_format = { type: "json_object" };
    }
    return fetch(chatCompletionsUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
  }

  let response = await request(REQUESTED_MODEL);
  let modelUsed = REQUESTED_MODEL;
  if (!response.ok && (response.status === 404 || response.status === 400)) {
    response = await request(COMPATIBLE_MODEL);
    modelUsed = COMPATIBLE_MODEL;
  }

  const payload = (await response.json()) as {
    choices?: NebiusChoice[];
    error?: { message?: string } | string;
  };

  if (!response.ok) {
    const message = typeof payload.error === "string" ? payload.error : payload.error?.message;
    throw new Error(message ?? `Nebius request failed (${response.status})`);
  }

  const message = payload.choices?.[0]?.message;
  const text = (message?.content || message?.reasoning_content || "").trim();

  if (!text) {
    throw new Error("Nebius returned an empty response.");
  }

  return { text, model: modelUsed };
}
