/**
 * The single Nebius client. Every non-voice reasoning call goes through
 * `generateOrchestratorText` here:
 *   - task / knowledge extraction (services/taskExtraction/orchestratorPrompt.ts)
 *   - conversation topic classification + summaries (services/conversations.ts)
 *   - post-call escalation decisions (services/callAnalysis.ts)
 *   - the demo chat route (routes/orchestrator.ts)
 *
 * Kept as one place so config, model fallback and error handling stay
 * consistent across those callers. Nothing else in the codebase should call
 * the Nebius API directly or read the NEBIUS_* environment variables.
 *
 * This runs on Nebius Token Factory's OpenAI-compatible API, on an NVIDIA
 * open model. The live phone call itself is a separate, latency-sensitive
 * path and stays on Gemini Live — see services/geminiVoiceSession.ts.
 *
 * Logging policy: this module never logs or embeds prompts, transcripts or
 * raw model output (they are derived from call transcripts). Errors carry
 * only the provider's own (truncated) message and HTTP status.
 */

import { logger } from "../lib/logger";

const DEFAULT_BASE_URL = "https://api.tokenfactory.nebius.com/v1";
const DEFAULT_MODEL = "nvidia/Nemotron-3_5-Lightning";
const DEFAULT_FALLBACK_MODEL = "Qwen/Qwen3.5-397B-A17B";

const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 8192;
const MAX_ERROR_MESSAGE_CHARS = 300;

/**
 * Read at call time (not import time) so tests and late-loaded env files see
 * the current values.
 */
export function getNebiusConfig() {
  return {
    apiKey: process.env.NEBIUS_API_KEY,
    baseUrl: (process.env.NEBIUS_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/+$/, ""),
    model: process.env.NEBIUS_MODEL ?? DEFAULT_MODEL,
    fallbackModel: process.env.NEBIUS_FALLBACK_MODEL ?? DEFAULT_FALLBACK_MODEL,
  };
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

type NebiusPayload = {
  choices?: NebiusChoice[];
  error?: { message?: string } | string;
};

/** Thrown when Nebius answers with a non-2xx status. */
export class NebiusApiError extends Error {
  readonly status: number;
  readonly model: string;

  constructor(message: string, status: number, model: string) {
    super(message);
    this.name = "NebiusApiError";
    this.status = status;
    this.model = model;
  }
}

/** Thrown when Nebius answers 2xx but with no usable text. */
export class OrchestratorEmptyResponseError extends Error {
  constructor() {
    super("Nebius returned an empty response.");
    this.name = "OrchestratorEmptyResponseError";
  }
}

function providerMessage(payload: NebiusPayload, status: number): string {
  const raw = typeof payload.error === "string" ? payload.error : payload.error?.message;
  const text = typeof raw === "string" && raw.trim() ? raw.trim() : `Nebius request failed (${status})`;
  return text.slice(0, MAX_ERROR_MESSAGE_CHARS);
}

export async function generateOrchestratorText(params: {
  systemInstructionText: string;
  turns: OrchestratorTextTurn[];
  jsonResponse?: boolean;
  /** Defaults to 0.7. Use a low value (e.g. 0.2) for structured extraction. */
  temperature?: number;
  /** Defaults to 8192. */
  maxTokens?: number;
}): Promise<{ text: string; model: string }> {
  const { apiKey, baseUrl, model: requestedModel, fallbackModel } = getNebiusConfig();
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
      temperature: params.temperature ?? DEFAULT_TEMPERATURE,
      max_tokens: params.maxTokens ?? DEFAULT_MAX_TOKENS,
    };
    if (params.jsonResponse) {
      body.response_format = { type: "json_object" };
    }
    return fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
  }

  let response = await request(requestedModel);
  let modelUsed = requestedModel;
  if (!response.ok && (response.status === 404 || response.status === 400)) {
    logger.warn(
      { status: response.status, requestedModel, fallbackModel },
      "nebius: requested model rejected, retrying with fallback model"
    );
    response = await request(fallbackModel);
    modelUsed = fallbackModel;
  }

  // A provider/proxy error page may not be JSON — don't let that mask the
  // real HTTP status with a SyntaxError.
  const payload = (await response.json().catch(() => ({}))) as NebiusPayload;

  if (!response.ok) {
    throw new NebiusApiError(providerMessage(payload, response.status), response.status, modelUsed);
  }

  const message = payload.choices?.[0]?.message;
  const text = (message?.content || message?.reasoning_content || "").trim();

  if (!text) {
    throw new OrchestratorEmptyResponseError();
  }

  return { text, model: modelUsed };
}
