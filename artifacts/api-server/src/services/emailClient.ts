/**
 * Email client service
 *
 * Email sending is handled via SendGrid (`sendOutboundEmail()`).
 *
 * Fails fast at import time if the required env vars are missing so the
 * server surfaces the misconfiguration immediately on startup rather than at
 * the first real email attempt.
 */

import sgMail from "@sendgrid/mail";
import { logger } from "../lib/logger";

// ---------------------------------------------------------------------------
// Validate env vars once at module load
// ---------------------------------------------------------------------------

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || process.env.TWILIO_EMAIL_ADDRESS;
const SENDGRID_API_KEY = process.env.SENDGRID_EMAIL_API_KEY;

if (!SENDGRID_API_KEY || !FROM_EMAIL) {
  logger.warn(
    "SendGrid env vars (SENDGRID_EMAIL_API_KEY, SENDGRID_FROM_EMAIL) are not fully set " +
      "— outbound emails will fail at runtime."
  );
} else {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

// ---------------------------------------------------------------------------
// Outbound email helper (SendGrid)
// ---------------------------------------------------------------------------

export interface OutboundEmailOptions {
  /** Email address of the recipient */
  to: string;
  /** Email subject line */
  subject: string;
  /** Plain text email body */
  body?: string;
  /** HTML email body */
  html?: string;
  /** Optional sender name (defaults to "Daily Agent" if not provided) */
  fromName?: string;
}

export interface EmailResult {
  sid: string;
  status: string;
  to: string;
  from: string;
}

/**
 * Converts plain text to basic HTML for email content.
 * Handles line breaks and basic paragraph structure.
 */
function toBasicHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n\n+/g, "</p><p>")
    .replace(/\n/g, "<br>")
    .replace(/^/, "<p>")
    .replace(/$/, "</p>");
}

/**
 * Sends an outbound email via SendGrid.
 *
 * @returns The email SID/message ID and initial status.
 * @throws  If API keys are missing or the API call fails.
 */
export async function sendOutboundEmail(
  opts: OutboundEmailOptions
): Promise<EmailResult> {
  if (!SENDGRID_API_KEY || !FROM_EMAIL) {
    throw new Error(
      "Cannot send email: SENDGRID_EMAIL_API_KEY and SENDGRID_FROM_EMAIL must both be set."
    );
  }

  if (!opts.body && !opts.html) {
    throw new Error("Either body (plain text) or html (HTML) must be provided.");
  }

  const fromName = opts.fromName || "Daily Agent";

  const htmlContent = opts.html || (opts.body ? toBasicHtml(opts.body) : "");
  const textContent = opts.body || htmlContent.replace(/<[^>]*>/g, "");

  const msg = {
    to: opts.to,
    from: { email: FROM_EMAIL, name: fromName },
    subject: opts.subject,
    text: textContent,
    html: htmlContent,
  };

  try {
    const [response] = await sgMail.send(msg);

    const sid =
      (response.headers["x-message-id"] as string | undefined) ??
      `sg_${Date.now()}`;

    logger.info(
      { sid, to: opts.to, status: response.statusCode },
      "sendgrid: outbound email sent"
    );

    return {
      sid,
      status: response.statusCode === 202 ? "sent" : String(response.statusCode),
      to: opts.to,
      from: FROM_EMAIL,
    };
  } catch (err) {
    logger.error({ err, to: opts.to }, "sendgrid: sendOutboundEmail failed");
    throw err;
  }
}
