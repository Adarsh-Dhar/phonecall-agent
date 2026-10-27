/**
 * Minimal email sender over the Resend HTTP API (no extra dependency).
 * Env: RESEND_API_KEY, MAIL_FROM (e.g. "Phone Agent <agent@yourdomain.com>").
 * Without both, sending is disabled and every call returns false.
 */
import { logger } from "../../lib/logger";
import { isTestMode } from "../../lib/testMode";

// S7: Capture mode for testing
const capturedEmails: Array<{
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
  headers?: Record<string, string>;
  timestamp: Date;
}> = [];

export function getCapturedEmails() {
  return [...capturedEmails];
}

export function clearCapturedEmails() {
  capturedEmails.length = 0;
}

export const emailConfigured = () => !!process.env.RESEND_API_KEY && !!process.env.MAIL_FROM;

export async function sendEmail(input: {
  to: string;
  subject: string;
  text: string;
  /** Where a human reply should go (the From address is a no-reply style sender). */
  replyTo?: string;
  /** Extra headers, e.g. List-Unsubscribe for one-click opt-out. */
  headers?: Record<string, string>;
}): Promise<boolean> {
  // S7: Capture mode for testing
  if (process.env.OUTBOUND_TRANSPORT === 'capture' && isTestMode()) {
    capturedEmails.push({
      ...input,
      timestamp: new Date(),
    });
    logger.info({ to: input.to, subject: input.subject }, "outbound/email: captured (test mode)");
    return true;
  }

  if (!emailConfigured()) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.MAIL_FROM,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
        ...(input.headers ? { headers: input.headers } : {}),
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      logger.error({ status: res.status }, "outbound/email: provider rejected the message");
      return false;
    }
    return true;
  } catch (err) {
    logger.error({ err }, "outbound/email: send failed");
    return false;
  }
}
