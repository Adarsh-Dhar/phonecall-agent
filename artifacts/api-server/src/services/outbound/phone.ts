/**
 * Phone numbers are free text on Account.phone. WhatsApp needs E.164 (+<country><number>), so this
 * normalises what it can and returns null for anything it cannot make sure of. It is a deliberate
 * subset of libphonenumber: when in doubt it returns null rather than messaging a wrong number.
 *
 * Accepted:
 *   "+91 98765 43210", "0091 98765 43210"          -> international, always trusted
 *   "098765 43210", "98765 43210", "919876543210"  -> national; needs DEFAULT_COUNTRY_CODE (e.g. 91)
 */
export function toE164(raw: string | null | undefined, defaultCountryCode = process.env.DEFAULT_COUNTRY_CODE): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  // Extensions ("x123", "ext 4") make a number undialable by WhatsApp.
  if (/(ext|x)\s*\.?\s*\d+\s*$/i.test(trimmed)) return null;

  const hasPlus = trimmed.startsWith("+");
  let digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;

  if (!hasPlus && digits.startsWith("00")) {
    digits = digits.slice(2); // 00 is the international call prefix
  } else if (!hasPlus) {
    const cc = (defaultCountryCode ?? "").replace(/\D/g, "");
    if (!cc) return null;
    const national = digits.replace(/^0/, ""); // single national trunk prefix
    // "919876543210": already carries the country code, just without the plus.
    digits = national.startsWith(cc) && national.length > 11 ? national : cc + national;
  }

  if (digits.startsWith("0") || digits.length < 8 || digits.length > 15) return null;
  return `+${digits}`;
}
