/** Validation for the business-messaging fields on a contact (shared by POST and PUT /contacts). */
import { toE164 } from "./phone";

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/;

/** undefined = leave unchanged, null / "" = clear, string = must look like one email address. */
export function parseContactEmail(v: unknown): Parsed<string | null | undefined> {
  if (v === undefined) return { ok: true, value: undefined };
  if (v === null || (typeof v === "string" && v.trim() === "")) return { ok: true, value: null };
  if (typeof v !== "string") return { ok: false, error: "contactEmail must be a string" };
  const email = v.trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) return { ok: false, error: "contactEmail is not a valid email address" };
  return { ok: true, value: email };
}

export function parseAllowFallback(v: unknown): Parsed<boolean | undefined> {
  if (v === undefined) return { ok: true, value: undefined };
  if (typeof v !== "boolean") return { ok: false, error: "allowFallbackMessage must be a boolean" };
  return { ok: true, value: v };
}

/** Messaging can only be switched on when there is somewhere to send it. */
export function hasUsableChannel(contactEmail: string | null | undefined, phone: string | null | undefined): boolean {
  return !!contactEmail || toE164(phone) !== null;
}

export const NO_CHANNEL_ERROR =
  "Add an email address, or a phone number in international format (+country code), before turning on fallback messages.";

/** Extra fields the UI needs, derived from the stored row. */
export function messagingView<T extends { phone: string | null }>(c: T): T & { whatsappReachable: boolean } {
  return { ...c, whatsappReachable: toE164(c.phone) !== null };
}
