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
 * Answer policy: only `message.content` is ever returned as the answer. The
 * model's reasoning (`reasoning_content`, or inline <think blocks>) is never
 * promoted to an answer; a reply with no real content throws
 * OrchestratorEmptyResponseError with a `reason` so callers can tell "nothing
 * to say" from "the model only reasoned / ran out of tokens".
 *
 * Fallback policy: the fallback model is used ONLY when the provider says the
 * requested model itself is unknown/unavailable (see isModelRejection). Any
 * other 4xx surfaces as a NebiusApiError. Every fallback is logged, counted
 * (getNebiusModelStatus) and flagged on the result (`fellBack`).
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
    // Reasoning models may put their chain of thought here. It is NOT the
    // answer and is never returned to callers.
    reasoning_content?: string | null;
  };
  finish_reason?: string | null;
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

export type EmptyResponseReason = "empty" | "reasoning_only" | "truncated";

/**
 * Thrown when Nebius answers 2xx but with no usable answer text.
 *  - "empty":          the model genuinely produced nothing.
 *  - "reasoning_only": only reasoning came back (reasoning mode misconfigured).
 *  - "truncated":      cut off by max_tokens (finish_reason "length").
 * Callers that treat "empty" as "nothing to do" must NOT do so for the others.
 */
export class OrchestratorEmptyResponseError extends Error {
  readonly reason: EmptyResponseReason;

  constructor(reason: EmptyResponseReason = "empty") {
    super(
      reason === "reasoning_only"
        ? "Nebius returned reasoning but no answer."
        : reason === "truncated"
          ? "Nebius response was cut off before any answer (max_tokens)."
          : "Nebius returned an empty response."
    );
    this.name = "OrchestratorEmptyResponseError";
    this.reason = reason;
  }
}

export type GenerateResult = {
  text: string;
  /** Model that actually produced `text`. */
  model: string;
  /** Model that was asked for first (NEBIUS_MODEL). */
  requestedModel: string;
  /** True when the fallback model answered instead of the requested one. */
  fellBack: boolean;
  /** Provider finish_reason; "length" means `text` may be cut off. */
  finishReason: string | null;
};

// ---------------------------------------------------------------------------
// Model fallback bookkeeping (process-local; surfaced by GET /healthz/nebius)
// ---------------------------------------------------------------------------

const modelStatus = {
  fallbackCount: 0,
  lastFallbackAt: null as string | null,
  lastRequestedModel: null as string | null,
  lastFallbackModel: null as string | null,
  lastRejectionStatus: null as number | null,
  lastRejectionMessage: null as string | null,
};

export function getNebiusModelStatus() {
  return { ...modelStatus };
}

export function resetNebiusModelStatus() {
  modelStatus.fallbackCount = 0;
  modelStatus.lastFallbackAt = null;
  modelStatus.lastRequestedModel = null;
  modelStatus.lastFallbackModel = null;
  modelStatus.lastRejectionStatus = null;
  modelStatus.lastRejectionMessage = null;
}

/**
 * True only when the provider is complaining about the MODEL itself. A bare
 * 400/404 is not enough: a 400 for an unsupported `response_format` or a 404
 * for a wrong base URL must surface, not be papered over by another model.
 *
 * NOTE: Nebius's exact error text for an unknown model is not documented in
 * what we have. If a genuinely bad model name stops falling back (and shows
 * up as a NebiusApiError instead), widen MODEL_REJECTION_REASON — failing
 * loudly is the intended direction.
 */
const MODEL_REJECTION_REASON =
  /(not found|does not exist|doesn't exist|unknown|invalid|unsupported|not supported|no such|unavailable|not available|not deployed|no access)/i;

// Errors that are about the REQUEST (parameters, size), even if the word
// "model" appears in them. These must surface, never trigger a fallback.
const REQUEST_ERROR =
  /(response_format|json_object|json_schema|max_tokens|temperature|messages?\b|context length|context window|too long|too many tokens|maximum context|schema)/i;

export function isModelRejection(status: number, message: string): boolean {
  if (status !== 404 && status !== 400) return false;
  if (!/model/i.test(message)) return false;
  if (REQUEST_ERROR.test(message)) return false;
  return MODEL_REJECTION_REASON.test(message);
}

/** Remove inline reasoning (some models put in `content`). */
export function stripReasoning(text: string): string {
  let out = text.replace(/<think[\s\S]*?<\/think>/gi, "");
  // An unterminated block means the model never reached its answer.
  const open = out.search(/<think>/i);
  if (open !== -1) out = out.slice(0, open);
  return out.trim();
}

/**
 * Optional JSON object merged into every request body, e.g. to switch a
 * reasoning model into non-thinking mode. The parameter name is
 * provider/model specific, so it is configuration, not code:
 *   NEBIUS_EXTRA_BODY='{"chat_template_kwargs":{"enable_thinking":false}}'
 * Cannot override model/messages/stream.
 */
function readExtraBody(): Record<string, unknown> {
  const raw = process.env.NEBIUS_EXTRA_BODY;
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not an object");
    const { model: _m, messages: _msgs, stream: _s, ...rest } = parsed as Record<string, unknown>;
    return rest;
  } catch {
    logger.warn("nebius: NEBIUS_EXTRA_BODY is not a valid JSON object, ignoring it");
    return {};
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
}): Promise<GenerateResult> {
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
      ...readExtraBody(),
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
  let payload = await readPayload(response);

  const canFallBack = Boolean(fallbackModel) && fallbackModel !== requestedModel;
  if (!response.ok && canFallBack) {
    const rejection = providerMessage(payload, response.status);
    if (isModelRejection(response.status, rejection)) {
      modelStatus.fallbackCount += 1;
      modelStatus.lastFallbackAt = new Date().toISOString();
      modelStatus.lastRequestedModel = requestedModel;
      modelStatus.lastFallbackModel = fallbackModel;
      modelStatus.lastRejectionStatus = response.status;
      modelStatus.lastRejectionMessage = rejection;
      logger.warn(
        { status: response.status, requestedModel, fallbackModel, reason: rejection, fallbackCount: modelStatus.fallbackCount },
        "nebius: requested model rejected, retrying with fallback model — check NEBIUS_MODEL"
      );
      response = await request(fallbackModel);
      modelUsed = fallbackModel;
      payload = await readPayload(response);
    }
  }

  if (!response.ok) {
    throw new NebiusApiError(providerMessage(payload, response.status), response.status, modelUsed);
  }

  const choice = payload.choices?.[0];
  const message = choice?.message;
  const finishReason = choice?.finish_reason ?? null;
  const text = stripReasoning(message?.content ?? "");

  if (!text) {
    const reason: EmptyResponseReason =
      finishReason === "length"
        ? "truncated"
        : message?.reasoning_content?.trim() || (message?.content ?? "").trim()
          ? "reasoning_only"
          : "empty";
    if (reason !== "empty") {
      // Metadata only — never the reasoning text itself.
      logger.warn({ model: modelUsed, reason, finishReason }, "nebius: reply had no answer text");
    }
    throw new OrchestratorEmptyResponseError(reason);
  }

  return { text, model: modelUsed, requestedModel, fellBack: modelUsed !== requestedModel, finishReason };
}

// A provider/proxy error page may not be JSON — don't let that mask the real
// HTTP status with a SyntaxError.
async function readPayload(response: Response): Promise<NebiusPayload> {
  return (await response.json().catch(() => ({}))) as NebiusPayload;
}
