/**
 * Test control plane — mounted at /_test ONLY when TEST_MODE=true (see app.ts, dynamic import).
 * Drives the fake Gemini (src/testing/fakeGemini.ts) and a few scheduler/introspection hooks.
 */

import { Router } from "express";
import { isTestMode } from "../lib/testMode";
import { getIntrospectionMetrics } from "../lib/introspection";
import { setAutoDialOverride } from "../services/callScheduler";

type Fake = typeof import("../testing/fakeGemini");
let fakeMod: Fake | null = null;
async function fake(): Promise<Fake> {
  if (!isTestMode()) throw new Error("test control used outside TEST_MODE");
  if (!fakeMod) {
    const p = "./testing/fakeGemini.mjs"; // emitted next to dist/index.mjs by build.mjs in TEST_MODE builds
    fakeMod = (await import(/* @vite-ignore */ p)) as Fake;
  }
  return fakeMod;
}

const router = Router();
router.use((_req, res, next) => {
  if (!isTestMode()) return res.status(404).end();
  next();
});

const wrap = (fn: (req: any, res: any) => Promise<unknown>) => (req: any, res: any) =>
  fn(req, res).catch((err: any) => res.status(500).json({ error: String(err?.message ?? err) }));

async function session(req: any, res: any) {
  const s = (await fake()).getSession(req.params.callId);
  if (!s) { res.status(404).json({ error: "no fake gemini session for call" }); return null; }
  if (s.closed) { res.status(409).json({ error: "session closed" }); return null; }
  return s;
}

// ---- Fake Gemini -------------------------------------------------------------
router.get("/gemini/sessions", wrap(async (_req, res) => res.json({ sessions: (await fake()).listSessions() })));

router.post("/gemini/reset", wrap(async (_req, res) => { (await fake()).resetFakeGemini(); res.json({ ok: true }); }));

router.post("/gemini/connect-mode", wrap(async (req, res) => {
  const { mode, slowMs, failNext } = req.body ?? {};
  if (!["ok", "fail", "slow", "rate-limit"].includes(mode)) return res.status(400).json({ error: "invalid mode" });
  (await fake()).setConnectMode(mode, { slowMs, failNext });
  res.json({ ok: true, mode });
}));

// The other party speaks.
router.post("/gemini/:callId/say", wrap(async (req, res) => {
  const s = await session(req, res); if (!s) return;
  if (typeof req.body?.text !== "string") return res.status(400).json({ error: "text required" });
  await s.userSay(req.body.text, req.body.turnComplete !== false);
  res.json({ ok: true });
}));

// The model speaks (transcription + optional PCM samples).
router.post("/gemini/:callId/agent-say", wrap(async (req, res) => {
  const s = await session(req, res); if (!s) return;
  if (typeof req.body?.text !== "string") return res.status(400).json({ error: "text required" });
  await s.agentSay(req.body.text, { turnComplete: req.body.turnComplete, audioSamples: req.body.audioSamples });
  res.json({ ok: true });
}));

router.post("/gemini/:callId/turn-complete", wrap(async (req, res) => {
  const s = await session(req, res); if (!s) return;
  await s.turnComplete();
  res.json({ ok: true });
}));

// The model calls a tool; responds with the app's tool response so scenarios can assert on it.
router.post("/gemini/:callId/tool", wrap(async (req, res) => {
  const s = await session(req, res); if (!s) return;
  const { name, args, timeoutMs } = req.body ?? {};
  if (!name) return res.status(400).json({ error: "tool name required" });
  try {
    const out = await s.toolCall(name, args ?? {}, timeoutMs);
    res.json({ ok: true, ...out });
  } catch (err: any) {
    res.status(504).json({ error: String(err?.message ?? err) });
  }
}));

router.post("/gemini/:callId/drop", wrap(async (req, res) => {
  const s = await session(req, res); if (!s) return;
  s.drop();
  res.json({ ok: true });
}));

router.get("/gemini/:callId/log", wrap(async (req, res) => {
  const f = await fake();
  const all = f.sessionHistory(req.params.callId);
  if (all.length === 0) return res.status(404).json({ error: "no session ever opened for call" });
  const cur = all[all.length - 1];
  res.json({ callId: req.params.callId, sessions: all.length, closed: cur.closed, log: cur.log, systemInstruction: cur.systemInstruction, connects: f.connectCount() });
}));

// ---- Scheduler -----------------------------------------------------------------
router.post("/scheduler/auto-dial", (req, res) => {
  const { enabled } = req.body ?? {};
  if (typeof enabled !== "boolean" && enabled !== null) return res.status(400).json({ error: "enabled must be boolean|null" });
  setAutoDialOverride(enabled);
  res.json({ ok: true, enabled });
});

// ---- Introspection ---------------------------------------------------------------
router.get("/state", wrap(async (_req, res) => res.json(await getIntrospectionMetrics())));

export { router as testControlRouter };
