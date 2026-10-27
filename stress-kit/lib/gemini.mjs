/**
 * Client for the fake-Gemini control plane (/_test/gemini/*, see artifacts/api-server/src/routes/testControl.ts).
 * Requires the server to run with TEST_MODE=true and GEMINI_DRIVER=fake (lib/server.mjs sets both).
 */
export class GeminiControl {
  constructor(baseUrl) {
    this.base = `${baseUrl.replace(/\/$/, '')}/_test`;
  }

  async _req(method, path, body) {
    const res = await fetch(`${this.base}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    let json = null;
    try { json = await res.json(); } catch { /* empty body */ }
    return { status: res.status, ok: res.ok, body: json };
  }

  reset() { return this._req('POST', '/gemini/reset'); }
  sessions() { return this._req('GET', '/gemini/sessions'); }
  connectMode(mode, opts = {}) { return this._req('POST', '/gemini/connect-mode', { mode, ...opts }); }
  /** The other party speaks. */
  say(callId, text, turnComplete = true) { return this._req('POST', `/gemini/${callId}/say`, { text, turnComplete }); }
  /** The model speaks. */
  agentSay(callId, text, opts = {}) { return this._req('POST', `/gemini/${callId}/agent-say`, { text, ...opts }); }
  turnComplete(callId) { return this._req('POST', `/gemini/${callId}/turn-complete`); }
  /** The model calls a tool. body.response is what the app answered. 504 = app never answered. */
  tool(callId, name, args, timeoutMs) { return this._req('POST', `/gemini/${callId}/tool`, { name, args, timeoutMs }); }
  drop(callId) { return this._req('POST', `/gemini/${callId}/drop`); }
  log(callId) { return this._req('GET', `/gemini/${callId}/log`); }
  autoDial(enabled) { return this._req('POST', '/scheduler/auto-dial', { enabled }); }
  state() { return this._req('GET', '/state'); }

  async waitForSession(callId, timeoutMs = 8000) {
    const end = Date.now() + timeoutMs;
    while (Date.now() < end) {
      const r = await this.log(callId);
      if (r.ok && !r.body.closed) return r.body;
      await new Promise((r2) => setTimeout(r2, 100));
    }
    throw new Error(`no live fake-Gemini session for call ${callId} within ${timeoutMs}ms`);
  }
}
