import { describe, it, expect, beforeEach } from "vitest";
import { toE164 } from "../outbound/phone";
import { signOptOutToken, verifyOptOutToken, optOutUrl } from "../outbound/optOut";
import { toTemplateParam } from "../outbound/whatsapp";

describe("toE164", () => {
  it("trusts international numbers", () => {
    expect(toE164("+91 98765-43210", undefined)).toBe("+919876543210");
    expect(toE164("0091 98765 43210", undefined)).toBe("+919876543210");
  });
  it("needs a default country code for national numbers", () => {
    expect(toE164("098765 43210", undefined)).toBeNull();
    expect(toE164("098765 43210", "91")).toBe("+919876543210");
    expect(toE164("98765 43210", "+91")).toBe("+919876543210");
  });
  it("does not double the country code when it is already there", () => {
    expect(toE164("919876543210", "91")).toBe("+919876543210");
  });
  it("rejects junk, extensions and bad lengths", () => {
    for (const bad of ["", null, undefined, "abc", "12345", "+1234567890123456", "555-1234 x22", "+0123456789"]) {
      expect(toE164(bad as string, "91")).toBeNull();
    }
  });
});

describe("opt-out token", () => {
  beforeEach(() => { process.env.JWT_SECRET = "s3cret"; process.env.APP_URL = "https://app.example.com/"; });

  it("round-trips and builds a URL", () => {
    const t = signOptOutToken("c1")!;
    expect(verifyOptOutToken(t)).toBe("c1");
    expect(optOutUrl("c1")).toBe(`https://app.example.com/api/outbound/opt-out?t=${t}`);
  });
  it("rejects tampering, other contacts' signatures, junk characters and wrong secret", () => {
    const t = signOptOutToken("c1")!;
    const [id, sig] = t.split(".");
    expect(verifyOptOutToken(`${Buffer.from("c2").toString("base64url")}.${sig}`)).toBeNull();
    expect(verifyOptOutToken(`${id}.${sig.slice(0, -2)}AA`)).toBeNull();
    expect(verifyOptOutToken(`${id}"<x>.${sig}`)).toBeNull();
    expect(verifyOptOutToken(undefined)).toBeNull();
    expect(verifyOptOutToken("a.b.c")).toBeNull();
    process.env.JWT_SECRET = "other";
    expect(verifyOptOutToken(t)).toBeNull();
  });
  it("cannot sign without a secret, and has no URL without APP_URL", () => {
    delete process.env.APP_URL;
    expect(optOutUrl("c1")).toBeNull();
    delete process.env.JWT_SECRET;
    expect(signOptOutToken("c1")).toBeNull();
  });
});

describe("toTemplateParam", () => {
  it("flattens what WhatsApp rejects", () => {
    expect(toTemplateParam("a\nb\t\tc      d")).toBe("a b c   d");
    expect(toTemplateParam("x".repeat(2000)).length).toBe(1000);
  });
});
