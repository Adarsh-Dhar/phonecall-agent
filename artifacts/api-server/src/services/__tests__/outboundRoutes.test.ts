import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";

vi.mock("../../lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } }));

const { prisma } = vi.hoisted(() => ({ prisma: {
  account: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn() },
  outboundMessage: { count: vi.fn(), create: vi.fn() },
} }));
vi.mock("@workspace/db-prisma", () => ({ prisma }));

import express from "express";
import cookieParser from "cookie-parser";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { signToken } from "../../lib/jwt";
import { requireAuth } from "../../lib/authMiddleware";
import outboundRouter from "../../routes/outbound";
import authRouter from "../../routes/auth";
import contactsRouter from "../../routes/contacts";
import { signOptOutToken } from "../outbound/optOut";

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
let server: Server; let base: string;
let owner: { id: string }; let contact: { id: string };
const made: string[] = [];

const cookie = () => ({ cookie: `token=${signToken({ userId: owner.id, email: "o@x.com" })}` });
const json = { "Content-Type": "application/json" };

beforeAll(async () => {
  const app = express();
  app.use(cookieParser()); app.use(express.json()); app.use(express.urlencoded({ extended: true }));
  app.use("/api", outboundRouter);
  app.use("/api", authRouter);
  app.use("/api", requireAuth, contactsRouter);
  server = app.listen(0); base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
  owner = { id: `owner-${runId}` };
  contact = { id: `contact-${runId}` };
  made.push(owner.id, contact.id);
  prisma.account.findUnique.mockResolvedValue({ id: owner.id, email: "o@x.com", emailFallback: true });
  prisma.account.update.mockResolvedValue({ id: owner.id, emailFallback: false } as any);
  prisma.account.updateMany.mockResolvedValue({ count: 1 });
  prisma.account.findFirst.mockResolvedValue({ id: contact.id, ownerId: owner.id } as any);
});
afterAll(async () => {
  await new Promise((r) => server.close(r));
});

describe("opt-out route (public)", () => {
  it("GET shows a confirmation and changes nothing", async () => {
    const t = signOptOutToken(contact.id)!;
    prisma.account.findUnique.mockResolvedValueOnce({ id: contact.id, allowFallbackMessage: true } as any);
    const r = await fetch(`${base}/outbound/opt-out?t=${t}`);
    expect(r.status).toBe(200);
    expect(await r.text()).toContain(`action="/api/outbound/opt-out?t=${t}"`);
  });
  it("rejects bad tokens on both verbs and never reflects them", async () => {
    for (const method of ["GET", "POST"]) {
      const r = await fetch(`${base}/outbound/opt-out?t=%22%3E%3Cscript%3E`, { method });
      expect(r.status).toBe(400);
      expect(await r.text()).not.toContain("<script>");
    }
  });
  it("POST (also the one-click form) opts the contact out", async () => {
    const t = signOptOutToken(contact.id)!;
    prisma.account.findUnique.mockResolvedValueOnce({ id: contact.id, allowFallbackMessage: true } as any);
    prisma.account.update.mockResolvedValueOnce({ id: contact.id, allowFallbackMessage: false } as any);
    const r = await fetch(`${base}/outbound/opt-out?t=${t}`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "List-Unsubscribe=One-Click" });
    expect(r.status).toBe(200);
  });
  it("answers the same for a deleted contact", async () => {
    prisma.account.findUnique.mockResolvedValueOnce(null);
    const r = await fetch(`${base}/outbound/opt-out?t=${signOptOutToken("gone")!}`, { method: "POST" });
    expect(r.status).toBe(200);
  });
});

describe("PATCH /user/email-fallback", () => {
  it("requires auth, validates, and persists", async () => {
    expect((await fetch(`${base}/user/email-fallback`)).status).toBe(401);
    expect((await fetch(`${base}/user/email-fallback`, { method: "PATCH", headers: { ...json, ...cookie() }, body: JSON.stringify({ enabled: "yes" }) })).status).toBe(400);
    prisma.account.findUnique.mockResolvedValueOnce({ id: owner.id, emailFallback: true } as any);
    prisma.account.update.mockResolvedValueOnce({ id: owner.id, emailFallback: false } as any);
    const r = await fetch(`${base}/user/email-fallback`, { method: "PATCH", headers: { ...json, ...cookie() }, body: JSON.stringify({ enabled: false }) });
    expect(await r.json()).toEqual({ enabled: false });
  });
});

describe("PUT /contacts/:id messaging fields", () => {
  const put = (body: unknown, id = contact.id) => fetch(`${base}/contacts/${id}`, { method: "PUT", headers: { ...json, ...cookie() }, body: JSON.stringify(body) });

  it("allows updating contact email", async () => {
    prisma.account.findUnique.mockResolvedValueOnce({ id: contact.id, ownerId: owner.id, phone: "+91 98765 43210", contactEmail: "desk@clinic.com", allowFallbackMessage: true } as any);
    prisma.account.update.mockResolvedValueOnce({ id: contact.id, contactEmail: "desk@clinic.com" } as any);
    const r = await put({ contactEmail: "desk@clinic.com" });
    expect(r.status).toBe(200);
  });
  it("rejects invalid email", async () => {
    prisma.account.findUnique.mockResolvedValueOnce({ id: contact.id, ownerId: owner.id } as any);
    expect((await put({ contactEmail: "nope" })).status).toBe(400);
  });
  it("rejects boolean for email", async () => {
    prisma.account.findUnique.mockResolvedValueOnce({ id: contact.id, ownerId: owner.id } as any);
    expect((await put({ contactEmail: 5 })).status).toBe(400);
  });
});
