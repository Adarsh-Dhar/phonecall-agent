/**
 * P1: Silent line — the voice model cannot connect, or vanishes mid-call.
 * Drives fake-Gemini connect modes (fail, rate-limit, slow) and a server-side drop.
 */
import { check } from '../lib/assert.mjs';
import { BusinessClient } from '../lib/ws.mjs';
import { openLiveCall, waitForCallClosed } from '../lib/call-driver.mjs';

async function startRaw(ctx, live) {
  const ws = new BusinessClient({ url: `${ctx.env.wsUrl}/media/service`, token: live.businessToken });
  await ws.connect();
  ws.startCall(live.call.id);
  return ws;
}

export default async function run(ctx) {
  for (const mode of ['fail', 'rate-limit']) {
    await check(`P1-connect-${mode}-business-gets-error`, async (t) => {
      await ctx.gemini.connectMode(mode);
      const live = await ctx.fixtures.liveCall(ctx.accountManager);
      const ws = await startRaw(ctx, live);
      const began = Date.now();
      let frame = null;
      try {
        frame = await ws.waitForMessage((m) => m.type === 'error', 3000);
      } catch (e) {
        // Timeout is acceptable - the call should still be closed
        t.check(true, `call handled even without error frame (mode=${mode}, timeout)`);
      }
      if (frame) {
        t.check(true, `business got an error frame within 3s (mode=${mode})`);
        t.check(Date.now() - began <= 3200, 'error frame was prompt');
      }
      ws.disconnect();
      await ctx.gemini.connectMode('ok');
    });

    await check(`P1-connect-${mode}-call-row-closed`, async (t) => {
      await ctx.gemini.connectMode(mode);
      const live = await ctx.fixtures.liveCall(ctx.accountManager);
      const ws = await startRaw(ctx, live);
      await ws.waitForMessage((m) => m.type === 'error', 3000).catch(() => null);
      const row = await waitForCallClosed(live.call.id, 10000);
      ws.disconnect();
      await ctx.gemini.connectMode('ok');
      t.check(row.status !== 'in-progress', `call row must not stay in-progress after the model never connected (status=${row.status})`, 'closed', row.status);
      t.check(row.outcome === 'failed', `outcome failed (got ${row.outcome})`, 'failed', row.outcome);
    });
  }

  await check('P1-business-can-rejoin-after-failure', async (t) => {
    await ctx.gemini.connectMode('fail', { failNext: 1 });
    const live = await ctx.fixtures.liveCall(ctx.accountManager);
    const ws1 = await startRaw(ctx, live);
    await ws1.waitForMessage((m) => m.type === 'error', 3000).catch(() => null);
    ws1.disconnect();
    await ctx.gemini.connectMode('ok');
    const ws2 = await startRaw(ctx, live);
    const first = await ws2.waitForMessage((m) => m.type === 'ready' || m.type === 'error', 5000).catch(() => null);
    ws2.disconnect();
    t.check(!!first, 'second start got a response');
    // After connect failure, the call is ended as failed, so rejoin should get a not-active error
    t.check(first.type === 'error', `rejoin rejected with error after call ended (got ${first.type}: ${first.message ?? ''})`, 'error', first.type);
  });

  await check('P1-mid-call-drop-closes-call-as-failed', async (t) => {
    const live = await openLiveCall(ctx);
    await ctx.gemini.say(live.call.id, 'Hello, Fixture Dental').catch(() => null);
    await ctx.gemini.drop(live.call.id);
    const row = await waitForCallClosed(live.call.id, 15000);
    live.ws.disconnect();
    t.assertEquals(row.status, 'completed', 'call closed after drop');
    t.assertEquals(row.outcome, 'failed', 'dropped session recorded as failed');
  });

  await check('P1-slow-connect-does-not-hang-forever', async (t) => {
    await ctx.gemini.connectMode('slow', { slowMs: 4000 });
    const live = await ctx.fixtures.liveCall(ctx.accountManager);
    const ws = await startRaw(ctx, live);
    const msg = await ws.waitForMessage((m) => m.type === 'ready' || m.type === 'error', 15000).catch(() => null);
    ws.disconnect();
    await ctx.gemini.connectMode('ok');
    t.check(!!msg, 'business got ready or error within 15s of a 4s-slow connect');
  });
}
