/**
 * The ONE Nebius Token Factory client. Every non-voice model call goes through
 * `callNebiusChat` — task/knowledge extraction, post-call analysis, topic
 * classification/summaries, and the demo chat route.
 *
 * Guarantees:
 *  - hard timeout per request (NEBIUS_TIMEOUT_MS, default 30s)
 *  - retries with backoff on 429 / 5xx / network errors / timeouts
 *  - response body is read as text and the status checked BEFORE JSON parsing,
 *    so an HTML 502 page is a clean error, not a SyntaxError
 *  - fallback model is used ONLY when the provider says the model itself is
 *    unavailable — never for parameter / context-length / bad-request errors
 *  - truncated (finish_reason=length) JSON replies are errors, not data
 *  - latency, token usage, retries and fallbacks are logged and counted
 *    (exposed at GET /healthz/nebius via getNebiusStats)
 *
 * The live phone call stays on Gemini Live — see services/geminiVoiceSession.ts.
 */
import { logger } from "../lib/logger";

const DEFAULT_MODEL = "nvidia/Nemotron-3_5-Lightning";
const DEFAULT_FALLBACK_MODEL = "Qwen/Qwen3.5-397B-A17B";

function config() {
  return {
    requestedModel: process.env.NEBIUS_MODEL ?? DEFAULT_MODEL,
    fallbackModel: process.env.NEBIUS_FALLBACK_MODEL ?? DEFAULT_FALLBACK_MODEL,
    baseUrl: (process.env.NEBIUS_BASE_URL ?? "https://api.tokenfactory.nebius.com/v1").replace(/\/+$/, ""),
    timeoutMs: Number(process.env.NEBIUS_TIMEOUT_MS ?? 30_000),
    maxRetries: Number(process.env.NEBIUS_MAX_RETRIES ?? 2),
    retryBaseMs: Number(process.env.NEBIUS_RETRY_BASE_MS ?? 500),
  };
}

export type OrchestratorTextTurn = { role: "user" | "assistant"; content: string };
export type NebiusMessage = { role: "system" | "user" | "assistant"; content: string };

/** Provider/transport failure. `model` is the model the request targeted. */
export class NebiusApiError extends Error {
  readonly retryable: boolean;
  constructor(
    message: string,
    public readonly status?: number,
    public readonly model?: string,
    retryable?: boolean,
  ) {
    super(message);
    this.name = "NebiusApiError";
    this.retryable = retryable ?? (status !== undefined && (status === 429 || status >= 500));
  }
}
/** Back-compat alias for older imports. */
export const NebiusError = NebiusApiError;
export type NebiusError = NebiusApiError;

/**
 * The provider answered 200 but gave us no usable answer.
 *  - "empty":          nothing at all
 *  - "reasoning_only": only chain-of-thought, no answer (never treated as the answer)
 *  - "truncated":      cut off by max_tokens before any answer
 */
export class OrchestratorEmptyResponseError extends Error {
  constructor(public readonly reason: "empty" | "reasoning_only" | "truncated" | string) {
    super(`Nebius returned no usable answer (${reason}).`);
    this.name = "OrchestratorEmptyResponseError";
  }
}

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

type Stats = {
  requests: number;
  successes: number;
  failures: number;
  retries: number;
  fallbackCount: number;
  truncated: number;
  promptTokens: number;
  completionTokens: number;
  totalLatencyMs: number;
  lastModelUsed: string | null;
  lastError: string | null;
  lastErrorAt: string | null;
};

const freshStats = (): Stats => ({
  requests: 0, successes: 0, failures: 0, retries: 0, fallbackCount: 0, truncated: 0,
  promptTokens: 0, completionTokens: 0, totalLatencyMs: 0,
  lastModelUsed: null, lastError: null, lastErrorAt: null,
});
let stats = freshStats();

export function getNebiusStats() {
  const cfg = config();
  return {
    ...stats,
    avgLatencyMs: stats.successes ? Math.round(stats.totalLatencyMs / stats.successes) : null,
    requestedModel: cfg.requestedModel,
    fallbackModel: cfg.fallbackModel,
  };
}
export function resetNebiusStats() { stats = freshStats(); }

// ---------------------------------------------------------------------------
// Fallback decision
// ---------------------------------------------------------------------------

// Errors about HOW we asked (not WHICH model) must surface, never trigger fallback.
const PARAMETER_ERROR = /response_format|json_object|json_schema|max_tokens|max_completion_tokens|temperature|context length|context window|maximum context|token limit|too long|too many tokens|parameter|messages?\b.*(invalid|must)/i;
const MODEL_UNAVAILABLE = /(model\b.*(not found|does not exist|doesn'?t exist|unknown|unsupported|not supported|not available|not enabled|not deployed|no access|not permitted|decommission|deprecated))|((unknown|invalid|unsupported|unavailable) model)|(no such model)/i;

/** True only when the provider says the *model* is unavailable to this key. */
export function isModelRejection(status: number, message: string): boolean {
  if (![400, 403, 404, 422].includes(status)) return false;
  if (PARAMETER_ERROR.test(message)) return false;
  return MODEL_UNAVAILABLE.test(message);
}

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------

type RawResult = {
  status: number;
  ok: boolean;
  payload: any;
  rawText: string;
  retryAfterMs: number | null;
};

function errorMessage(r: RawResult): string {
  const p = r.payload;
  const m = typeof p?.error === "string" ? p.error : p?.error?.message ?? p?.message;
  return m || r.rawText.slice(0, 300) || `Nebius request failed (${r.status})`;
}

async function post(model: string, body: Record<string, unknown>, apiKey: string): Promise<RawResult> {
  const cfg = config();
  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ ...body, model }),
    signal: AbortSignal.timeout(cfg.timeoutMs),
  });
  const rawText = await res.text(); // read text first; never res.json() before checking status
  let payload: any = null;
  try { payload = rawText ? JSON.parse(rawText) : null; } catch { /* non-JSON body (e.g. HTML 502) */ }
  const ra = Number(res.headers.get("retry-after"));
  return { status: res.status, ok: res.ok, payload, rawText, retryAfterMs: Number.isFinite(ra) && ra > 0 ? Math.min(ra * 1000, 10_000) : null };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** One model, with retries on transient failures. Throws NebiusApiError on failure. */
async function postWithRetry(model: string, body: Record<string, unknown>, apiKey: string): Promise<RawResult> {
  const cfg = config();
  let lastErr: unknown;
  for (let attempt = 0; attempt <= cfg.maxRetries; attempt++) {
    try {
      const r = await post(model, body, apiKey);
      if (r.ok) return r;
      const transient = r.status === 429 || r.status >= 500;
      if (!transient || attempt === cfg.maxRetries) {
        throw new NebiusApiError(errorMessage(r), r.status, model, transient);
      }
      stats.retries++;
      const wait = r.retryAfterMs ?? cfg.retryBaseMs * 2 ** attempt + Math.random() * cfg.retryBaseMs;
      logger.warn({ model, status: r.status, attempt, waitMs: Math.round(wait) }, "nebius: transient error, retrying");
      await sleep(wait);
      lastErr = new NebiusApiError(errorMessage(r), r.status, model, true);
    } catch (err) {
      if (err instanceof NebiusApiError) throw err;
      // network error or timeout (AbortError / TimeoutError)
      if (attempt === cfg.maxRetries) {
        throw new NebiusApiError(`Nebius request failed: ${(err as Error).message}`, undefined, model, true);
      }
      stats.retries++;
      const wait = cfg.retryBaseMs * 2 ** attempt;
      logger.warn({ model, attempt, err: (err as Error).message }, "nebius: network/timeout error, retrying");
      await sleep(wait);
      lastErr = err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new NebiusApiError("Nebius request failed", undefined, model, true);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type NebiusChatResult = {
  text: string;
  /** Model that actually answered. */
  model: string;
  /** Model we asked for first (differs from `model` only when fellBack). */
  requestedModel: string;
  fellBack: boolean;
  finishReason: string | null;
  usage: { promptTokens: number; completionTokens: number } | null;
};

export async function callNebiusChat(params: {
  messages: NebiusMessage[];
  temperature?: number;
  maxTokens?: number;
  jsonResponse?: boolean;
  /** Short label for logs/metrics, e.g. "extraction", "call_analysis". */
  purpose?: string;
}): Promise<NebiusChatResult> {
  const apiKey = process.env.NEBIUS_API_KEY;
  if (!apiKey) throw new NebiusApiError("NEBIUS_API_KEY is not configured.");

  const cfg = config();
  const body: Record<string, unknown> = {
    messages: params.messages,
    temperature: params.temperature ?? 0.3,
    max_tokens: params.maxTokens ?? 1024,
  };
  if (params.jsonResponse) body.response_format = { type: "json_object" };

  const started = Date.now();
  stats.requests++;
  let modelUsed = cfg.requestedModel;
  let raw: RawResult;

  try {
    try {
      raw = await postWithRetry(cfg.requestedModel, body, apiKey);
    } catch (err) {
      if (
        err instanceof NebiusApiError &&
        err.status !== undefined &&
        cfg.fallbackModel !== cfg.requestedModel &&
        isModelRejection(err.status, err.message)
      ) {
        stats.fallbackCount++;
        logger.warn(
          { requested: cfg.requestedModel, fallback: cfg.fallbackModel, status: err.status, reason: err.message, purpose: params.purpose },
          "nebius: requested model rejected by provider, using fallback model",
        );
        modelUsed = cfg.fallbackModel;
        raw = await postWithRetry(cfg.fallbackModel, body, apiKey);
      } else {
        throw err;
      }
    }

    const choice = raw.payload?.choices?.[0];
    const message = choice?.message;
    const text = String(message?.content ?? "").trim();
    const reasoning = String(message?.reasoning_content ?? "").trim();
    const finishReason: string | null = choice?.finish_reason ?? null;

    if (finishReason === "length") stats.truncated++;
    if (!text) {
      // Chain-of-thought is NOT the answer; never hand it to a JSON parser.
      throw new OrchestratorEmptyResponseError(
        finishReason === "length" ? "truncated" : reasoning ? "reasoning_only" : "empty",
      );
    }
    // A non-empty reply cut off by max_tokens is returned with finishReason "length";
    // callers that need complete JSON must check it.

    const usage = raw.payload?.usage
      ? { promptTokens: Number(raw.payload.usage.prompt_tokens ?? 0), completionTokens: Number(raw.payload.usage.completion_tokens ?? 0) }
      : null;

    const latencyMs = Date.now() - started;
    stats.successes++;
    stats.totalLatencyMs += latencyMs;
    stats.lastModelUsed = modelUsed;
    if (usage) { stats.promptTokens += usage.promptTokens; stats.completionTokens += usage.completionTokens; }
    logger.info({ purpose: params.purpose, model: modelUsed, latencyMs, finishReason, ...usage }, "nebius: request ok");

    return { text, model: modelUsed, requestedModel: cfg.requestedModel, fellBack: modelUsed !== cfg.requestedModel, finishReason, usage };
  } catch (err) {
    stats.failures++;
    stats.lastError = (err as Error).message;
    stats.lastErrorAt = new Date().toISOString();
    logger.error({ purpose: params.purpose, model: modelUsed, err: (err as Error).message, latencyMs: Date.now() - started }, "nebius: request failed");
    throw err;
  }
}

/**
 * Chat-style helper kept for existing callers (conversations.ts, callAnalysis.ts).
 * Defaults are conservative for decision calls; pass temperature/maxTokens to override.
 */
export async function generateOrchestratorText(params: {
  systemInstructionText: string;
  turns: OrchestratorTextTurn[];
  jsonResponse?: boolean;
  temperature?: number;
  maxTokens?: number;
  purpose?: string;
}): Promise<{ text: string; model: string; requestedModel: string; fellBack: boolean; finishReason: string | null }> {
  const messages: NebiusMessage[] = [
    { role: "system", content: params.systemInstructionText },
    ...params.turns.map((t) => ({ role: t.role, content: t.content }) as NebiusMessage),
  ];

  // Some providers reject a history that ends on the assistant's own turn.
  if (messages[messages.length - 1].role === "assistant") {
    messages.push({ role: "user", content: "(End of transcript. Respond now, following the instructions above.)" });
  }

  const r = await callNebiusChat({
    messages,
    temperature: params.temperature,
    maxTokens: params.maxTokens,
    jsonResponse: params.jsonResponse,
    purpose: params.purpose,
  });
  return { text: r.text, model: r.model, requestedModel: r.requestedModel, fellBack: r.fellBack, finishReason: r.finishReason };
}
