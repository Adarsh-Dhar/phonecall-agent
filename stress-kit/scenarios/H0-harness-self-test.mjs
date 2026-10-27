/**
 * H0: Harness self-test. Part 1 proves the RUNNER cannot lie (uses a private TestRunner, no server).
 * Part 2 proves the infrastructure is alive. If any part-1 check fails, no other verdict is trustworthy.
 */
import { check, TestRunner, Ledger } from '../lib/assert.mjs';
import fs from 'fs';
import os from 'os';
import path from 'path';

function privateRunner(knownRed = []) {
  const file = path.join(os.tmpdir(), `h0-ledger-${process.pid}-${Math.random().toString(36).slice(2)}.json`);
  fs.writeFileSync(file, JSON.stringify(knownRed.map((checkId) => ({ checkId, reason: 'h0' }))));
  const r = new TestRunner(new Ledger(file));
  return { r, cleanup: () => fs.rmSync(file, { force: true }) };
}

export default async function run(ctx) {
  const { env, api, server, fakeNebius } = ctx;

  await check('H0-runner-passes-real-assertion', async (t) => {
    const { r, cleanup } = privateRunner();
    const res = await r.runCheck('x', 'x', async (c) => c.check(true, 'ok'));
    cleanup();
    t.assertEquals(res.verdict, 'PASS', 'one passing assertion => PASS');
  });

  await check('H0-runner-fails-on-failed-assertion', async (t) => {
    const { r, cleanup } = privateRunner();
    const res = await r.runCheck('x', 'x', async (c) => c.check(false, 'nope'));
    cleanup();
    t.assertEquals(res.verdict, 'FAIL', 'failed assertion => FAIL');
  });

  await check('H0-runner-fails-on-thrown-error', async (t) => {
    const { r, cleanup } = privateRunner();
    const res = await r.runCheck('x', 'x', async () => { throw new TypeError('fixtures.contact is not a function'); });
    cleanup();
    t.assertEquals(res.verdict, 'FAIL', 'thrown error => FAIL, never PASS');
  });

  await check('H0-runner-fails-on-zero-assertions', async (t) => {
    const { r, cleanup } = privateRunner();
    const res = await r.runCheck('x', 'x', async () => true);
    cleanup();
    t.assertEquals(res.verdict, 'FAIL', 'returning true with no assertions => FAIL');
  });

  await check('H0-runner-ledger-cannot-excuse-harness-error', async (t) => {
    const { r, cleanup } = privateRunner(['x']);
    const res = await r.runCheck('x', 'x', async () => { throw new Error('boom'); });
    cleanup();
    t.assertEquals(res.verdict, 'FAIL', 'known-red does not excuse a harness error');
  });

  await check('H0-runner-known-red-and-skip', async (t) => {
    const { r, cleanup } = privateRunner(['x']);
    const red = await r.runCheck('x', 'x', async (c) => c.check(false, 'known bug'));
    const skip = await r.runCheck('y', 'y', async (c) => c.skip('why'));
    cleanup();
    t.assertEquals(red.verdict, 'KNOWN-RED', 'assertion failure on ledgered check => KNOWN-RED');
    t.assertEquals(skip.verdict, 'SKIPPED', 'skip => SKIPPED');
    t.assertEquals(r.getExitCode(), 2, 'a skipped check makes the exit code non-zero');
  });

  await check('H0-env-validation', async (t) => {
    t.check(!!env.testDatabaseUrl, 'TEST_DATABASE_URL is set');
    t.check(!!env.jwtSecret, 'JWT_SECRET is set');
    t.check(env.testDatabaseUrl.includes('_test'), 'database name contains _test');
    t.check(env.baseUrl.includes('localhost'), 'BASE_URL is localhost');
  });

  await check('H0-server-running', async (t) => {
    t.check(!!server && server.isRunning(), 'server instance is running');
  });

  await check('H0-api-reachable', async (t) => {
    const res = await api.get('/health');
    t.check(res.status < 500, `health returned ${res.status}`);
  });

  await check('H0-test-control-mounted', async (t) => {
    const res = await ctx.gemini.state();
    t.check(res.ok, `/_test/state reachable (status ${res.status}); server must run with TEST_MODE=true`);
  });

  await check('H0-authed-call-works', async (t) => {
    const acct = await ctx.accountManager.createIndividual();
    const token = await ctx.accountManager.mintJwt(acct.id);
    const res = await fetch(`${env.baseUrl}/api/contacts`, { headers: { Authorization: `Bearer ${token}` } });
    t.check(res.status !== 401, `minted token accepted by the server (status ${res.status})`);
  });

  await check('H0-fake-nebius-request', async (t) => {
    fakeNebius.setMode('ok');
    fakeNebius.clearRequests();
    const res = await fetch('http://localhost:9453/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'm', messages: [{ role: 'user', content: 'ping' }] }),
    });
    t.check(res.ok, 'fake Nebius answered OK');
    t.check(fakeNebius.getRequests().length === 1, 'fake Nebius recorded exactly one request');
  });

  await check('H0-fake-nebius-modes-differ', async (t) => {
    const codes = {};
    for (const mode of ['429', '500', '401']) {
      fakeNebius.setMode(mode);
      const res = await fetch('http://localhost:9453/v1/chat/completions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'm', messages: [{ role: 'user', content: 'x' }] }),
      });
      codes[mode] = res.status;
    }
    fakeNebius.setMode('ok');
    t.assertEquals(codes, { '429': 429, '500': 500, '401': 401 }, 'each fault mode returns its status code');
  });
}
