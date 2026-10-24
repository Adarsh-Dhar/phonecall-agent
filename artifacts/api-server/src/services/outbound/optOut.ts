/**
 * Signed opt-out links for messages sent to businesses. The link carries the contact id plus an
 * HMAC, so nobody can opt-out (or probe) a contact they do not hold a link for. Links never expire:
 * an opt-out link in an old email must keep working.
 */
import crypto from "node:crypto";

const b64 = (s: Buffer | string) => Buffer.from(s).toString("base64url");

function mac(contactId: string): Buffer | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  return crypto.createHmac("sha256", secret).update(`outbound-optout:v1:${contactId}`).digest();
}

export function signOptOutToken(contactId: string): string | null {
  const m = mac(contactId);
  return m ? `${b64(contactId)}.${b64(m)}` : null;
}

/** Returns the contact id when the token is authentic, otherwise null. */
export function verifyOptOutToken(token: unknown): string | null {
  // Strict shape first: Buffer's base64url decoder silently skips invalid characters, so without
  // this a token with junk characters mixed in would still verify.
  if (typeof token !== "string" || token.length > 512 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) return null;
  const [idPart, sigPart, ...rest] = token.split(".");
  if (!idPart || !sigPart || rest.length) return null;
  let contactId: string;
  let sig: Buffer;
  try {
    contactId = Buffer.from(idPart, "base64url").toString("utf8");
    sig = Buffer.from(sigPart, "base64url");
  } catch {
    return null;
  }
  const expected = mac(contactId);
  if (!expected || sig.length !== expected.length) return null;
  return crypto.timingSafeEqual(sig, expected) ? contactId : null;
}

/** Needs APP_URL (public base URL). Without it a business message must not be sent. */
export function optOutUrl(contactId: string): string | null {
  const base = process.env.APP_URL?.replace(/\/$/, "");
  const token = signOptOutToken(contactId);
  return base && token ? `${base}/api/outbound/opt-out?t=${token}` : null;
}
