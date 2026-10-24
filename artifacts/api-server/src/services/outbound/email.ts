/**
 * Minimal email sender over the Resend HTTP API (no extra dependency).
 * Env: RESEND_API_KEY, MAIL_FROM (e.g. "Phone Agent <agent@yourdomain.com>").
 * Without both, sending is disabled and every call returns false.
 */
import { logger } from "../../lib/logger";

export const emailConfigured = () => !!process.env.RESEND_API_KEY && !!process.env.MAIL_FROM;

export async function sendEmail(input: { to: string; subject: string; text: string }): Promise<boolean> {
  if (!emailConfigured()) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.MAIL_FROM, to: [input.to], subject: input.subject, text: input.text }),
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
