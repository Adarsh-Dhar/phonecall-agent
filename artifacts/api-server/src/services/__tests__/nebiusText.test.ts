import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import {
  callNebiusChat, generateOrchestratorText, getNebiusStats, isModelRejection, resetNebiusStats, NebiusError,
} from "../nebiusText";

const ok = (content: string, extra: object = {}) =>
  new Response(JSON.stringify({ choices: [{ message: { content }, finish_reason: "stop" }], usage: { prompt_tokens: 10, completion_tokens: 5 }, ...extra }), { status: 200 });
const err = (status: number, message: string, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify({ error: { message } }), { status, headers });

describe("nebiusText", () => {
  beforeEach(() => {
    process.env.NEBIUS_API_KEY = "k";
    process.env.NEBIUS_MODEL = "req/model";
    process.env.NEBIUS_FALLBACK_MODEL = "fb/model";
    process.env.NEBIUS_RETRY_BASE_MS = "1";
    process.env.NEBIUS_MAX_RETRIES = "2";
    resetNebiusStats();
  });
  afterEach(() => { vi.unstubAllGlobals(); });

  it("isModelRejection: only model-unavailable errors fall back", () => {
    expect(isModelRejection(404, "The model `req/model` does not exist")).toBe(true);
    expect(isModelRejection(403, "model not enabled for this key")).toBe(true);
    expect(isModelRejection(400, "invalid response_format for model X")).toBe(false);
    expect(isModelRejection(400, "max_tokens too large for model X")).toBe(false);
    expect(isModelRejection(400, "maximum context length exceeded for model X")).toBe(false);
    expect(isModelRejection(404, "route not found")).toBe(false);
    expect(isModelRejection(500, "model does not exist")).toBe(false);
  });

  it("returns text, model, usage and records metrics", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(ok("hello")));
    const r = await callNebiusChat({ messages: [{ role: "user", content: "hi" }] });
    expect(r).toMatchObject({ text: "hello", model: "req/model", usage: { promptTokens: 10, completionTokens: 5 } });
    const s = getNebiusStats();
    expect(s).toMatchObject({ requests: 1, successes: 1, fallbackCount: 0, promptTokens: 10, completionTokens: 5, lastModelUsed: "req/model" });
  });

  it("falls back when the model itself is rejected, and counts it", async () => {
    const f = vi.fn().mockResolvedValueOnce(err(404, "model req/model does not exist")).mockResolvedValueOnce(ok("from fallback"));
    vi.stubGlobal("fetch", f);
    const r = await callNebiusChat({ messages: [{ role: "user", content: "hi" }] });
    expect(r.model).toBe("fb/model");
    expect(JSON.parse((f.mock.calls[1][1] as any).body).model).toBe("fb/model");
    expect(getNebiusStats().fallbackCount).toBe(1);
  });

  it("does NOT fall back on a parameter error — it surfaces", async () => {
    const f = vi.fn().mockResolvedValue(err(400, "invalid response_format for model req/model"));
    vi.stubGlobal("fetch", f);
    await expect(callNebiusChat({ messages: [{ role: "user", content: "hi" }], jsonResponse: true })).rejects.toThrow(/response_format/);
    expect(f).toHaveBeenCalledTimes(1);
    expect(getNebiusStats().fallbackCount).toBe(0);
  });

  it("retries 429 and 5xx, then succeeds", async () => {
    const f = vi.fn().mockResolvedValueOnce(err(429, "slow down", { "retry-after": "0" })).mockResolvedValueOnce(err(503, "unavailable")).mockResolvedValueOnce(ok("done"));
    vi.stubGlobal("fetch", f);
    const r = await callNebiusChat({ messages: [{ role: "user", content: "hi" }] });
    expect(r.text).toBe("done");
    expect(f).toHaveBeenCalledTimes(3);
    expect(getNebiusStats().retries).toBe(2);
  });

  it("gives up after maxRetries and throws a retryable NebiusError", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => err(500, "boom")));
    await expect(callNebiusChat({ messages: [{ role: "user", content: "hi" }] })).rejects.toMatchObject({ name: "NebiusError", status: 500, retryable: true });
  });

  it("retries network errors / timeouts", async () => {
    const f = vi.fn().mockRejectedValueOnce(new Error("fetch failed")).mockResolvedValueOnce(ok("recovered"));
    vi.stubGlobal("fetch", f);
    expect((await callNebiusChat({ messages: [{ role: "user", content: "hi" }] })).text).toBe("recovered");
  });

  it("checks status before parsing: an HTML error page is a clean error, not a SyntaxError", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => new Response("<html>Bad gateway</html>", { status: 502 })));
    const e = await callNebiusChat({ messages: [{ role: "user", content: "hi" }] }).catch((x) => x);
    expect(e).toBeInstanceOf(NebiusError);
    expect(e.status).toBe(502);
  });

  it("a truncated JSON reply is an error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: '{"a":' }, finish_reason: "length" }] }), { status: 200 })));
    await expect(callNebiusChat({ messages: [{ role: "user", content: "hi" }], jsonResponse: true })).rejects.toThrow(/cut off/);
    expect(getNebiusStats().truncated).toBe(1);
  });

  it("empty reply is an error; reasoning_content is used when content is empty", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(ok("")));
    await expect(callNebiusChat({ messages: [{ role: "user", content: "hi" }] })).rejects.toThrow(/empty/);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: null, reasoning_content: "answer" }, finish_reason: "stop" }] }), { status: 200 })));
    expect((await callNebiusChat({ messages: [{ role: "user", content: "hi" }] })).text).toBe("answer");
  });

  it("generateOrchestratorText appends a user turn when history ends on the assistant, and forwards temperature/maxTokens", async () => {
    const f = vi.fn().mockResolvedValue(ok("x"));
    vi.stubGlobal("fetch", f);
    await generateOrchestratorText({ systemInstructionText: "sys", turns: [{ role: "assistant", content: "bye" }], temperature: 0, maxTokens: 16 });
    const body = JSON.parse((f.mock.calls[0][1] as any).body);
    expect(body.messages.at(-1).role).toBe("user");
    expect(body).toMatchObject({ temperature: 0, max_tokens: 16 });
  });
});
