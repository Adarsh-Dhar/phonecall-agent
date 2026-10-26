import 'dotenv/config';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import WebSocket from 'ws';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';

const die = (m) => { console.error('STRESS-KIT REFUSING TO RUN: ' + m); process.exit(2); };
export const BASE = process.env.BASE_URL || 'http://localhost:5175';
const DB = process.env.TEST_DATABASE_URL;
const SECRET = process.env.JWT_SECRET;
if (!DB) die('TEST_DATABASE_URL is not set');
if (!SECRET) die('JWT_SECRET is not set');
if (!new URL(DB).pathname.slice(1).endsWith('_test') && process.env.STRESS_FORCE !== '1') die('database name must end in _test');
if (!/localhost|127\.0\.0\.1/.test(BASE) && process.env.STRESS_FORCE !== '1') die('BASE_URL is not localhost');

export const num = (k, d) => Number(process.env[k] ?? d);
export const db = new pg.Pool({ connectionString: DB, max: 5 });
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const FILE = new URL('./.accounts.json', import.meta.url);
const HOURS_24_7 = JSON.stringify({ days: [0, 1, 2, 3, 4, 5, 6], start: 0, end: 24, tz: 'UTC' });

const mint = (id, email, expiresIn = '2h') => jwt.sign({ userId: id, email }, SECRET, { expiresIn });
export const mintFor = (a, opts) => mint(a.id, a.email, opts);

export async function seed(nInd, nBiz) {
  const mk = async (kind, i) => {
    const id = 's' + randomBytes(10).toString('hex');
    const email = `stress_${kind}_${i}@stress.test`;
    const isBiz = kind === 'biz';
    await db.query(
      `INSERT INTO "Account"(id,email,name,"isService",business,category,timezone,"businessHoursJson","updatedAt")
       VALUES($1,$2,$3,$4,$5,$6,'UTC',$7,now()) ON CONFLICT (email) DO UPDATE SET "updatedAt"=now() RETURNING id`,
      [id, email, `Stress ${kind} ${i}`, isBiz, isBiz ? `Stress Co ${i}` : null, isBiz ? 'Other' : null, isBiz ? HOURS_24_7 : null]);
    const { rows } = await db.query(`SELECT id FROM "Account" WHERE email=$1`, [email]);
    return { id: rows[0].id, email, kind, token: mint(rows[0].id, email) };
  };
  const inds = [], bizs = [];
  for (let i = 0; i < nInd; i++) inds.push(await mk('ind', i));
  for (let i = 0; i < nBiz; i++) bizs.push(await mk('biz', i));
  fs.writeFileSync(FILE, JSON.stringify({ inds, bizs }));
  return { inds, bizs };
}
export function load() {
  if (!fs.existsSync(FILE)) die('run `npm run seed` first');
  const d = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  const fresh = (a) => ({ ...a, token: mintFor(a) }); // re-mint so tokens never expire mid-run
  return { inds: d.inds.map(fresh), bizs: d.bizs.map(fresh) };
}

export async function api(who, method, path, body, headers = {}) {
  const t0 = performance.now();
  try {
    const r = await fetch(BASE + path, {
      method,
      headers: { 'content-type': 'application/json', ...(who ? { cookie: `token=${who.token}` } : {}), ...headers },
      body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
    });
    const text = await r.text();
    let json = null; try { json = JSON.parse(text); } catch {}
    return { status: r.status, ms: performance.now() - t0, json, text };
  } catch (e) { return { status: 0, ms: performance.now() - t0, error: String(e), json: null, text: '' }; }
}

export async function runPool(concurrency, total, fn) {
  let i = 0; const out = new Array(total);
  await Promise.all(Array.from({ length: concurrency }, async () => { while (i < total) { const k = i++; out[k] = await fn(k); } }));
  return out;
}
const pct = (a, p) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]; };
export function latency(label, results) {
  const ms = results.map((r) => r.ms), h = {};
  results.forEach((r) => { h[r.status] = (h[r.status] || 0) + 1; });
  const out = { label, n: results.length, p50: +pct(ms, 50).toFixed(0), p95: +pct(ms, 95).toFixed(0), p99: +pct(ms, 99).toFixed(0), max: +Math.max(0, ...ms).toFixed(0), status: h };
  console.log('  ' + JSON.stringify(out));
  return out;
}

// Link both directions via the REAL API so calling works (individual<->business must each save the other).
export async function link(ind, biz) {
  const a = await api(ind, 'POST', `/contacts/from-account/${biz.id}`);
  const b = await api(biz, 'POST', `/api/business/contacts/from-account/${ind.id}`);
  const ok = (r) => r.status === 201 || r.status === 409;
  if (!ok(a) || !ok(b)) throw new Error(`link failed ind=${a.status} biz=${b.status} ${a.text.slice(0, 120)} ${b.text.slice(0, 120)}`);
  const { rows } = await db.query(`SELECT id FROM "Account" WHERE "ownerId"=$1 AND "linkedAccountId"=$2 LIMIT 1`, [ind.id, biz.id]);
  const { rows: r2 } = await db.query(`SELECT id FROM "Account" WHERE "ownerId"=$1 AND "linkedAccountId"=$2 LIMIT 1`, [biz.id, ind.id]);
  return { indContactId: rows[0].id, bizContactId: r2[0].id };
}

export function wsOpen(who, path, { query = false } = {}) {
  const url = BASE.replace(/^http/, 'ws') + path + (query ? `?token=${who.token}` : '');
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url, query ? {} : { headers: { cookie: `token=${who.token}` } });
    ws.once('open', () => resolve(ws));
    ws.once('unexpected-response', (_q, res) => reject(Object.assign(new Error('HTTP ' + res.statusCode), { status: res.statusCode })));
    ws.once('error', (e) => reject(e));
  });
}

export function suite(name) {
  const fails = [], infos = [];
  console.log(`\n=== ${name} ===`);
  return {
    check(label, ok, detail = '') { console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && detail ? '  -> ' + detail : ''}`); if (!ok) fails.push(label); },
    info(label, detail) { console.log(`  INFO  ${label}: ${detail}`); infos.push(label); },
    async done() { await db.end().catch(() => {}); console.log(fails.length ? `\n${fails.length} FAILED: ${fails.join(' | ')}` : '\nall checks passed'); process.exit(fails.length ? 1 : 0); },
  };
}
