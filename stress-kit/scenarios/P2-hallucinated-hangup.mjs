/**
 * P2: Hallucinated hang-up — end_call arguments are untrusted model output.
 * Every case opens a real live call (business socket -> fake Gemini), fires end_call with a hostile
 * payload, and asserts on the Call row the server actually wrote.
 */
import { check } from '../lib/assert.mjs';
import { openLiveCall, waitForCallClosed, taskCount } from '../lib/call-driver.mjs';

const OUTCOMES = ['booked', 'rescheduled', 'cancelled', 'info_gathered', 'needs_user', 'failed'];
const iso = (ms) => new Date(Date.now() + ms).toISOString();

/** Open a call, fire end_call(args), let the goodbye "finish", return the closed row. */
async function endWith(ctx, args, { twice = false } = {}) {
  const live = await openLiveCall(ctx);
  try {
    const first = await ctx.gemini.tool(live.call.id, 'end_call', args, 5000);
    if (twice) await ctx.gemini.tool(live.call.id, 'end_call', args, 1500).catch(() => null);
    await ctx.gemini.turnComplete(live.call.id).catch(() => null);
    const row = await waitForCallClosed(live.call.id, 20000);
    return { live, row, first };
  } finally {
    live.ws.disconnect();
  }
}

export default async function run(ctx) {
  const closedWithEnum = (t, row) => {
    t.check(!!row, 'call row exists');
    t.check(row.status === 'completed', `call row closed (status=${row?.status})`, 'completed', row?.status);
    t.check(!!row.endedAt, 'endedAt set');
    t.check(OUTCOMES.includes(row.outcome), `outcome in enum (got ${row.outcome})`, OUTCOMES, row.outcome);
  };

  await check('P2-valid-booking-kept', async (t) => {
    const when = iso(3 * 86400_000);
    const { row } = await endWith(ctx, { outcome: 'booked', summary: 'Booked Tuesday 3pm', confirmedAt: when });
    closedWithEnum(t, row);
    t.assertEquals(row.outcome, 'booked', 'valid future booking stays booked');
    t.check(!!row.confirmedAt, 'confirmedAt stored');
  });

  await check('P2-booked-without-time-downgraded', async (t) => {
    const { row } = await endWith(ctx, { outcome: 'booked', summary: 'Booked!' });
    closedWithEnum(t, row);
    t.assertEquals(row.outcome, 'needs_user', 'booked without confirmedAt becomes needs_user');
    t.check(row.confirmedAt === null, 'no confirmedAt invented');
  });

  await check('P2-booked-in-past-downgraded', async (t) => {
    const { row } = await endWith(ctx, { outcome: 'booked', summary: 'Booked', confirmedAt: iso(-7 * 86400_000) });
    closedWithEnum(t, row);
    t.assertEquals(row.outcome, 'needs_user', 'past confirmedAt downgraded');
  });

  await check('P2-invalid-date-does-not-throw', async (t) => {
    const { row } = await endWith(ctx, { outcome: 'rescheduled', summary: 'x', confirmedAt: 'next tuesday-ish' });
    closedWithEnum(t, row);
    t.assertEquals(row.outcome, 'needs_user', 'unparseable date downgraded, call still closed');
  });

  await check('P2-unknown-outcome-becomes-failed', async (t) => {
    const { row } = await endWith(ctx, { outcome: 'sold_out', summary: 'They are sold out' });
    closedWithEnum(t, row);
    t.assertEquals(row.outcome, 'failed', 'outcome outside enum -> failed');
  });

  await check('P2-summary-as-object', async (t) => {
    const { row } = await endWith(ctx, { outcome: 'info_gathered', summary: { a: 1, nested: { b: [1, 2] } } });
    closedWithEnum(t, row);
    t.check(typeof row.outcomeSummary === 'string' && row.outcomeSummary.length > 0, 'summary stored as non-empty string');
  });

  await check('P2-empty-args', async (t) => {
    const { row } = await endWith(ctx, {});
    closedWithEnum(t, row);
    t.assertEquals(row.outcome, 'failed', 'empty args -> failed');
  });

  await check('P2-null-args', async (t) => {
    const { row } = await endWith(ctx, null);
    closedWithEnum(t, row);
  });

  await check('P2-500-followups-capped', async (t) => {
    const followUps = Array.from({ length: 500 }, (_, i) => ({ kind: 'bring', title: `Item ${i}`, details: 'x' }));
    const { live, row } = await endWith(ctx, { outcome: 'info_gathered', summary: 'many', followUps });
    closedWithEnum(t, row);
    const n = await taskCount(live.conversation.id);
    t.check(n <= 25, `follow-up tasks capped (created ${n}, cap 20 + slack)`, '<=25', n);
  });

  await check('P2-end-call-twice', async (t) => {
    const { row } = await endWith(ctx, { outcome: 'info_gathered', summary: 'once' }, { twice: true });
    closedWithEnum(t, row);
    t.assertEquals(row.outcome, 'info_gathered', 'second end_call did not overwrite the first');
  });

  await check('P2-business-hangs-up-first', async (t) => {
    const live = await openLiveCall(ctx);
    live.ws.close();
    const row = await waitForCallClosed(live.call.id, 20000);
    // Don't use closedWithEnum since outcome may be null
    t.check(!!row, 'call row exists');
    t.check(row.status === 'completed', `call row closed (status=${row?.status})`, 'completed', row?.status);
    t.check(!!row.endedAt, 'endedAt set');
    t.assertEquals(row.disconnectedBy, 'user', 'recorded as disconnected by the business');
    const late = await ctx.gemini.tool(live.call.id, 'end_call', { outcome: 'booked', summary: 'late' }, 1500).catch(() => null);
    const after = await waitForCallClosed(live.call.id, 2000);
    // When business hangs up first, outcome may be null (handled downstream with rescheduling)
    t.check(after.outcome === row.outcome, 'late end_call after hang-up does not rewrite the outcome');
    void late;
    // Ensure WebSocket is properly terminated
    live.ws.disconnect();
  });

  await check('P2-business-socket-closed-after-end', async (t) => {
    const live = await openLiveCall(ctx);
    await ctx.gemini.tool(live.call.id, 'end_call', { outcome: 'info_gathered', summary: 'bye' }, 5000);
    await ctx.gemini.turnComplete(live.call.id).catch(() => null);
    await waitForCallClosed(live.call.id, 20000);
    const end = Date.now() + 5000;
    while (live.ws.connected && Date.now() < end) await new Promise((r) => setTimeout(r, 100));
    t.check(!live.ws.connected, 'business socket closed by server');
    t.check(live.ws.getMessages((m) => m.type === 'call_ended').length >= 1, 'business received call_ended');
  });

  await check('P2-server-still-healthy', async (t) => {
    const res = await ctx.api.get('/health');
    t.check(res.status < 500, `health ${res.status}`);
  });
}
