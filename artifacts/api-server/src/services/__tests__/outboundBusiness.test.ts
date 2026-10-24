import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } }));
const { prisma } = vi.hoisted(() => ({
  prisma: {
    account: { findFirst: vi.fn(), findUnique: vi.fn() },
    outboundMessage: { count: vi.fn(), create: vi.fn() },
  },
}));
vi.mock("@workspace/db-prisma", () => ({ prisma }));

import { messageBusinessFallback, notifyOwnerFallback, buildBusinessMessage } from "../outbound";

const input = { ownerId: "o1", contactId: "c1", taskId: "t1", taskTitle: "Book a checkup", attempts: 5 };
const contact = (over = {}) => ({ name: "Clinic", contactEmail: "desk@clinic.com", phone: "+91 98765 43210", allowFallbackMessage: true, ...over });
const bodies = (f: ReturnType<typeof vi.fn>) => f.mock.calls.map(([url, init]) => ({ url: String(url), body: JSON.parse(init.body) }));

describe("messageBusinessFallback", () => {
  const env = { ...process.env };
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(process.env, {
      RESEND_API_KEY: "k", MAIL_FROM: "a@b.c", APP_URL: "https://app.example.com", JWT_SECRET: "s",
      WHATSAPP_TOKEN: "w", WHATSAPP_PHONE_NUMBER_ID: "123", WHATSAPP_TEMPLATE_NAME: "tpl",
    });
    prisma.account.findFirst.mockResolvedValue(contact());
    prisma.account.findUnique.mockResolvedValue({ name: "Asha", email: "asha@me.com" });
    prisma.outboundMessage.count.mockResolvedValue(0);
    prisma.outboundMessage.create.mockResolvedValue({});
  });
  afterEach(() => { process.env = { ...env }; vi.unstubAllGlobals(); });

  it("emails first and stops after the first delivery", async () => {
    const f = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", f);
    expect(await messageBusinessFallback(input)).toEqual({ channel: "email", delivered: true });
    expect(f).toHaveBeenCalledTimes(1);
    const { body } = bodies(f)[0];
    expect(body.to).toEqual(["desk@clinic.com"]);
    expect(body.reply_to).toBe("asha@me.com");
    expect(body.headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
    expect(body.text).toContain("/api/outbound/opt-out?t=");
    expect(prisma.outboundMessage.create.mock.calls[0][0].data).toMatchObject({ audience: "business", channel: "email", status: "sent", taskId: "t1", contactId: "c1" });
  });

  it("falls through to WhatsApp when email fails, and logs both attempts", async () => {
    const f = vi.fn().mockImplementation(async (url: string) => ({ ok: !String(url).includes("resend") }));
    vi.stubGlobal("fetch", f);
    expect(await messageBusinessFallback(input)).toEqual({ channel: "whatsapp", delivered: true });
    const calls = bodies(f);
    expect(calls[1].url).toContain("graph.facebook.com");
    expect(calls[1].body.to).toBe("919876543210");
    expect(calls[1].body.template.components[0].parameters[0].text).not.toMatch(/[\n\t]/);
    expect(prisma.outboundMessage.create.mock.calls.map((c) => [c[0].data.channel, c[0].data.status])).toEqual([["email", "failed"], ["whatsapp", "sent"]]);
  });

  it("reports an error (and sends nothing more) when every channel fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    expect(await messageBusinessFallback(input)).toEqual({ channel: "none", delivered: false, reason: "error" });
  });

  it("sends nothing unless the contact is opted in", async () => {
    const f = vi.fn(); vi.stubGlobal("fetch", f);
    prisma.account.findFirst.mockResolvedValue(contact({ allowFallbackMessage: false }));
    expect((await messageBusinessFallback(input)).reason).toBe("not_opted_in");
    prisma.account.findFirst.mockResolvedValue(null); // not this owner's contact
    expect((await messageBusinessFallback(input)).reason).toBe("not_opted_in");
    expect(f).not.toHaveBeenCalled();
  });

  it("handles a contact with no email and no usable phone", async () => {
    const f = vi.fn(); vi.stubGlobal("fetch", f);
    prisma.account.findFirst.mockResolvedValue(contact({ contactEmail: null, phone: "12345" }));
    expect((await messageBusinessFallback(input)).reason).toBe("no_channel");
    expect(f).not.toHaveBeenCalled();
  });

  it("skips providers that are not configured", async () => {
    const f = vi.fn().mockResolvedValue({ ok: true }); vi.stubGlobal("fetch", f);
    delete process.env.RESEND_API_KEY;
    expect((await messageBusinessFallback(input)).channel).toBe("whatsapp");
    delete process.env.WHATSAPP_TOKEN;
    expect((await messageBusinessFallback(input)).reason).toBe("no_channel");
  });

  it("refuses without an opt-out link (no APP_URL)", async () => {
    const f = vi.fn(); vi.stubGlobal("fetch", f);
    delete process.env.APP_URL;
    expect((await messageBusinessFallback(input)).reason).toBe("no_app_url");
    expect(f).not.toHaveBeenCalled();
  });

  it("rate limits: one per task, two per contact per day", async () => {
    const f = vi.fn().mockResolvedValue({ ok: true }); vi.stubGlobal("fetch", f);
    prisma.outboundMessage.count.mockImplementation(async ({ where }: any) => (where.taskId ? 1 : 0));
    expect((await messageBusinessFallback(input)).reason).toBe("rate_limited");
    prisma.outboundMessage.count.mockImplementation(async ({ where }: any) => (where.contactId ? 2 : 0));
    expect((await messageBusinessFallback(input)).reason).toBe("rate_limited");
    expect(f).not.toHaveBeenCalled();
  });

  it("only counts successful business sends from the last 24h", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    await messageBusinessFallback(input);
    const where = prisma.outboundMessage.count.mock.calls[0][0].where;
    expect(where).toMatchObject({ audience: "business", status: "sent" });
    expect(Date.now() - where.createdAt.gte.getTime()).toBeGreaterThan(24 * 3600e3 - 5000);
  });

  it("never throws", async () => {
    prisma.account.findFirst.mockRejectedValue(new Error("db"));
    expect(await messageBusinessFallback(input)).toEqual({ channel: "none", delivered: false, reason: "error" });
  });
});

describe("buildBusinessMessage", () => {
  it("contains only the owner name, contact name, title and opt-out link", () => {
    const m = buildBusinessMessage({ ownerName: "Asha", contactName: "Clinic", taskTitle: "Book\nA  checkup", attempts: 5, optOutUrl: "https://x/o", canReply: true });
    expect(m.text).toContain('about: "Book A checkup"');
    expect(m.text).toContain("https://x/o");
    expect(m.short).not.toMatch(/\n/);
    expect(m.subject).not.toMatch(/\n/);
  });
  it("falls back to a neutral sender name and truncates long titles", () => {
    const m = buildBusinessMessage({ ownerName: null, contactName: "C", taskTitle: "x".repeat(500), attempts: 3, optOutUrl: "u", canReply: false });
    expect(m.text).toContain("A customer of yours");
    expect(m.text).not.toContain("replying to this email");
    expect(m.text.length).toBeLessThan(700);
  });
});

describe("notifyOwnerFallback audit log", () => {
  beforeEach(() => { vi.clearAllMocks(); Object.assign(process.env, { RESEND_API_KEY: "k", MAIL_FROM: "a@b.c" }); });
  afterEach(() => vi.unstubAllGlobals());
  it("records the attempt, and a log failure never blocks the email", async () => {
    prisma.account.findUnique.mockResolvedValue({ email: "o@x.com", emailFallback: true });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    prisma.outboundMessage.create.mockRejectedValue(new Error("db"));
    expect(await notifyOwnerFallback("o1", { subject: "s", text: "t", taskId: "t9" })).toEqual({ channel: "email", delivered: true });
    expect(prisma.outboundMessage.create.mock.calls[0][0].data).toMatchObject({ audience: "owner", taskId: "t9", status: "sent" });
  });
});
