/**
 * Shared driver for phone-agent scenarios: opens a live call the way production does
 * (business socket -> /media/service -> {type:"start"}) so the server opens a (fake) Gemini session.
 */
import { BusinessClient } from './ws.mjs';
import { db } from './env.mjs';

export async function openLiveCall(ctx, opts = {}) {
  const { fixtures, accountManager, env, gemini } = ctx;
  const live = await fixtures.liveCall(accountManager, opts);
  const ws = new BusinessClient({ url: `${env.wsUrl}/media/service`, token: live.businessToken });
  await ws.connect();
  ws.startCall(live.call.id);
  await ws.waitForMessage((m) => m.type === 'ready' || m.type === 'error', 8000)
    .then((m) => { if (m.type === 'error') throw new Error(`start rejected: ${m.message}`); });
  await gemini.waitForSession(live.call.id);
  return { ...live, ws };
}

export async function getCallRow(callId) {
  const r = await db.query(
    'SELECT status, outcome, "outcomeSummary", "confirmedAt", "endedAt" FROM "Call" WHERE id = $1', [callId]);
  return r.rows[0] || null;
}

export async function waitForCallClosed(callId, timeoutMs = 20000) {
  const end = Date.now() + timeoutMs;
  let row = null;
  while (Date.now() < end) {
    row = await getCallRow(callId);
    if (row && row.status !== 'in-progress' && row.status !== 'ringing') return row;
    await new Promise((r) => setTimeout(r, 250));
  }
  return row; // still open: caller's assertion fails with the real state
}

export async function taskCount(conversationId) {
  const r = await db.query('SELECT count(*)::int AS n FROM "Task" WHERE "conversationId" = $1', [conversationId]);
  return r.rows[0].n;
}
