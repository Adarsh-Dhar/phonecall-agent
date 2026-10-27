/**
 * Fake Gemini Live client — TEST ONLY.
 *
 * Loaded exclusively via dynamic import from geminiVoiceSession.ts when
 * GEMINI_DRIVER=fake && TEST_MODE=true. build.mjs marks this file external,
 * so it is never in the production bundle.
 *
 * Implements the subset of @google/genai `ai.live.connect()` that geminiVoiceSession uses:
 *   connect({ callbacks }) -> { sendRealtimeInput, sendClientContent, sendToolResponse, close }
 * The /_test/gemini/* control plane (routes/testControl.ts) drives it.
 */

export type ConnectMode = "ok" | "fail" | "slow" | "rate-limit";

interface Callbacks {
  onopen?: () => void;
  onmessage: (msg: any) => void | Promise<void>;
  onerror?: (err: unknown) => void;
  onclose?: () => void;
}

export interface LogEntry {
  t: number;
  type: "connected" | "audio_in" | "text_in" | "tool_response" | "closed" | "error";
  data?: unknown;
}

export class FakeSession {
  readonly log: LogEntry[] = [];
  closed = false;
  readonly systemInstruction: string;
  private toolWaiters = new Map<string, (r: unknown) => void>();
  private toolResponses = new Map<string, unknown>();
  private seq = 0;

  constructor(readonly callId: string, private cb: Callbacks, systemInstruction: string) {
    this.systemInstruction = systemInstruction;
    this.push("connected");
  }

  push(type: LogEntry["type"], data?: unknown) {
    this.log.push({ t: Date.now(), type, data });
  }

  // ---- control plane -> app ------------------------------------------------
  /** Other party speaks (input transcription), optionally ending the turn. */
  async userSay(text: string, turnComplete = true) {
    this.assertOpen();
    await this.cb.onmessage({ serverContent: { inputTranscription: { text } } });
    if (turnComplete) await this.turnComplete();
  }

  /** Model speaks (output transcription + optional audio), optionally ending the turn. */
  async agentSay(text: string, opts: { turnComplete?: boolean; audioSamples?: number } = {}) {
    this.assertOpen();
    await this.cb.onmessage({ serverContent: { outputTranscription: { text } } });
    if (opts.audioSamples) {
      const buf = Buffer.alloc(opts.audioSamples * 2);
      await this.cb.onmessage({
        serverContent: { modelTurn: { parts: [{ inlineData: { data: buf.toString("base64"), mimeType: "audio/pcm;rate=24000" } }] } },
      });
    }
    if (opts.turnComplete !== false) await this.turnComplete();
  }

  async turnComplete() {
    this.assertOpen();
    await this.cb.onmessage({ serverContent: { turnComplete: true } });
  }

  /** Model calls a tool. Resolves with the response the app sent back (or rejects on timeout). */
  async toolCall(name: string, args: unknown, timeoutMs = 10_000): Promise<{ id: string; response: unknown }> {
    this.assertOpen();
    const id = `fake-fc-${++this.seq}`;
    const waiter = new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.toolWaiters.delete(id);
        reject(new Error(`no tool response for ${name} within ${timeoutMs}ms`));
      }, timeoutMs);
      this.toolWaiters.set(id, (r) => { clearTimeout(timer); resolve(r); });
    });
    // Deliver without awaiting the handler: the handler awaits app code that may itself be slow.
    void Promise.resolve(this.cb.onmessage({ toolCall: { functionCalls: [{ id, name, args }] } })).catch((err) => {
      this.push("error", String(err));
    });
    return { id, response: await waiter };
  }

  /** Server-side drop (network loss / Gemini closes the socket). */
  drop() {
    if (this.closed) return;
    this.closed = true;
    this.push("closed", { by: "server" });
    this.cb.onclose?.();
  }

  // ---- app -> fake (the surface geminiVoiceSession calls) -------------------
  asLiveSession() {
    return {
      sendRealtimeInput: (input: any) => {
        if (this.closed) throw new Error("fake gemini: session closed");
        this.push("audio_in", { bytes: input?.audio?.data?.length ?? 0 });
      },
      sendClientContent: (content: any) => {
        if (this.closed) throw new Error("fake gemini: session closed");
        this.push("text_in", content?.turns?.[0]?.parts?.[0]?.text ?? null);
      },
      sendToolResponse: (resp: any) => {
        if (this.closed) throw new Error("fake gemini: session closed");
        for (const fr of resp?.functionResponses ?? []) {
          this.push("tool_response", fr);
          this.toolResponses.set(fr.id, fr.response);
          this.toolWaiters.get(fr.id)?.(fr.response);
          this.toolWaiters.delete(fr.id);
        }
      },
      close: () => {
        if (this.closed) return;
        this.closed = true;
        this.push("closed", { by: "app" });
        // Real SDK does not fire onclose for a client-initiated close in a way the app relies on.
      },
    };
  }

  private assertOpen() {
    if (this.closed) throw new Error(`fake gemini: session for call ${this.callId} is closed`);
  }
}

// ---- registry --------------------------------------------------------------
const state = {
  connectMode: "ok" as ConnectMode,
  slowMs: 5_000,
  sessions: new Map<string, FakeSession>(),      // live sessions by callId
  history: new Map<string, FakeSession[]>(),     // every session ever opened, per callId
  connects: 0,
  failNext: 0,
};

export function setConnectMode(mode: ConnectMode, opts: { slowMs?: number; failNext?: number } = {}) {
  state.connectMode = mode;
  if (opts.slowMs !== undefined) state.slowMs = opts.slowMs;
  state.failNext = opts.failNext ?? 0;
}
export function getSession(callId: string): FakeSession | undefined { return state.sessions.get(callId); }
export function listSessions() {
  return [...state.sessions.values()].map((s) => ({ callId: s.callId, closed: s.closed }));
}
export function sessionHistory(callId: string) { return state.history.get(callId) ?? []; }
export function connectCount() { return state.connects; }
export function resetFakeGemini() {
  for (const s of state.sessions.values()) s.drop();
  state.sessions.clear(); state.history.clear();
  state.connectMode = "ok"; state.connects = 0; state.failNext = 0; state.slowMs = 5_000;
}

export function createFakeGeminiClient(callId: string) {
  return {
    live: {
      async connect(config: { config?: any; callbacks: Callbacks }) {
        state.connects++;
        let mode = state.connectMode;
        if (state.failNext > 0) { state.failNext--; mode = "fail"; }
        if (mode === "fail") throw new Error("fake gemini: connect failed");
        if (mode === "rate-limit") {
          const e: any = new Error("fake gemini: 429 RESOURCE_EXHAUSTED");
          e.status = 429;
          throw e;
        }
        if (mode === "slow") await new Promise((r) => setTimeout(r, state.slowMs));

        const si = config.config?.systemInstruction?.parts?.[0]?.text ?? "";
        const session = new FakeSession(callId, config.callbacks, si);
        state.sessions.set(callId, session);
        const h = state.history.get(callId) ?? [];
        h.push(session);
        state.history.set(callId, h);
        queueMicrotask(() => config.callbacks.onopen?.());
        return session.asLiveSession();
      },
    },
  };
}
