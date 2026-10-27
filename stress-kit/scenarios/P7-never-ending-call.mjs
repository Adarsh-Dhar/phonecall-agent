/**
 * P7: Never-ending call — the model never calls end_call.
 * The server must hang up at MAX_CALL_DURATION_MINUTES (lib/server.mjs passes 1 minute in TEST_MODE
 * via MAX_CALL_DURATION_MINUTES; override with P7_CAP_MINUTES).
 */
import { check } from '../lib/assert.mjs';
import { openLiveCall, waitForCallClosed } from '../lib/call-driver.mjs';

export default async function run(ctx) {
  const capMin = Number(process.env.P7_CAP_MINUTES || 1);

  await check('P7-call-hung-up-at-cap', async (t) => {
    const live = await openLiveCall(ctx);
    // Business keeps talking, model keeps answering, nobody ever ends the call.
    const talk = setInterval(() => {
      ctx.gemini.say(live.call.id, 'Still here, one moment please').catch(() => {});
    }, 5000);
    let row;
    try {
      row = await waitForCallClosed(live.call.id, capMin * 60_000 + 20_000);
    } finally {
      clearInterval(talk);
    }
    t.check(row.status === 'completed', `call closed by the cap (status=${row.status})`, 'completed', row.status);
    t.check(!!row.endedAt, 'endedAt set');
    t.check(row.outcome === 'needs_user', `cap outcome is needs_user (got ${row.outcome})`, 'needs_user', row.outcome);
    const end = Date.now() + 5000;
    while (live.ws.connected && Date.now() < end) await new Promise((r) => setTimeout(r, 100));
    t.check(!live.ws.connected, 'business socket closed at the cap');
    live.ws.disconnect();
  });

  await check('P7-junk-frames-do-not-crash-server', async (t) => {
    const live = await openLiveCall(ctx);
    for (let i = 0; i < 2000; i++) {
      try { live.ws.ws.send(i % 2 ? 'not json {{{' : JSON.stringify({ type: 'nonsense', n: i })); } catch { break; }
    }
    await new Promise((r) => setTimeout(r, 500));
    const res = await ctx.api.get('/health');
    live.ws.disconnect();
    t.check(res.status < 500, `server healthy after 2000 junk frames (${res.status})`);
  });

  await check('P7-oversized-frame-closes-1009', async (t) => {
    const live = await openLiveCall(ctx);
    let closeCode = null;
    live.ws.ws.on('close', (code) => { closeCode = code; });
    try { live.ws.ws.send(JSON.stringify({ type: 'audio', payload: 'A'.repeat(30 * 1024 * 1024) })); } catch { /* socket may close mid-send */ }
    const end = Date.now() + 8000;
    while (closeCode === null && Date.now() < end) await new Promise((r) => setTimeout(r, 100));
    live.ws.disconnect();
    t.check(closeCode === 1009, `oversized frame closes with 1009 (got ${closeCode})`, 1009, closeCode);
  });
}
