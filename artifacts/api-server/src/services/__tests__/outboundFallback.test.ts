import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } }));
const { prisma } = vi.hoisted(() => ({ prisma: { account: { findUnique: vi.fn() } } }));
vi.mock("@workspace/db-prisma", () => ({ prisma }));

import { notifyOwnerFallback } from "../outbound";

const msg = { subject: "s", text: "t", url: "/tasks/1" };

describe("notifyOwnerFallback", () => {
  const env = { ...process.env };
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = "k";
    process.env.MAIL_FROM = "a@b.c";
    process.env.APP_URL = "https://app.example.com/";
  });
  afterEach(() => { process.env = { ...env }; vi.unstubAllGlobals(); });

  it("sends an email with an app link", async () => {
    prisma.account.findUnique.mockResolvedValue({ email: "o@x.com", emailFallback: true });
    const f = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", f);
    expect(await notifyOwnerFallback("o1", msg)).toEqual({ channel: "email", delivered: true });
    const body = JSON.parse(f.mock.calls[0][1].body);
    expect(body.to).toEqual(["o@x.com"]);
    expect(body.text).toContain("https://app.example.com/tasks/1");
  });

  it("does nothing when the owner opted out", async () => {
    prisma.account.findUnique.mockResolvedValue({ email: "o@x.com", emailFallback: false });
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    expect(await notifyOwnerFallback("o1", msg)).toEqual({ channel: "none", delivered: false });
    expect(f).not.toHaveBeenCalled();
  });

  it("reports not delivered when the provider is unconfigured or rejects", async () => {
    prisma.account.findUnique.mockResolvedValue({ email: "o@x.com", emailFallback: true });
    delete process.env.RESEND_API_KEY;
    expect((await notifyOwnerFallback("o1", msg)).delivered).toBe(false);
    process.env.RESEND_API_KEY = "k";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    expect((await notifyOwnerFallback("o1", msg)).delivered).toBe(false);
  });

  it("never throws", async () => {
    prisma.account.findUnique.mockRejectedValue(new Error("db"));
    await expect(notifyOwnerFallback("o1", msg)).resolves.toEqual({ channel: "none", delivered: false });
  });
});
