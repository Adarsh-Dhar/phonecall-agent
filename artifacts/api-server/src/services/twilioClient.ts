/**
 * Twilio client service
 *
 * Wraps the Twilio REST SDK and exposes a single `placeOutboundCall()` helper.
 * The raw `twilioClient` is also exported for any one-off SDK calls (e.g.
 * updating call status, fetching recordings).
 *
 * Email sending is handled via SendGrid (`sendOutboundEmail()`).
 *
 * Fails fast at import time if the required env vars are missing so the
 * server surfaces the misconfiguration immediately on startup rather than at
 * the first real call attempt.
 */

import twilio from "twilio";
import sgMail from "@sendgrid/mail";
import { logger } from "../lib/logger";

// ---------------------------------------------------------------------------
// Validate env vars once at module load
// ---------------------------------------------------------------------------

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || process.env.TWILIO_EMAIL_ADDRESS;
const SENDGRID_API_KEY = process.env.SENDGRID_EMAIL_API_KEY;

if (!ACCOUNT_SID || !AUTH_TOKEN || !FROM_NUMBER) {
  logger.warn(
    "Twilio env vars (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER) " +
      "are not fully set — outbound calls will fail at runtime."
  );
}

if (!SENDGRID_API_KEY || !FROM_EMAIL) {
  logger.warn(
    "SendGrid env vars (SENDGRID_EMAIL_API_KEY, SENDGRID_FROM_EMAIL) are not fully set " +
      "— outbound emails will fail at runtime."
  );
} else {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

// ---------------------------------------------------------------------------
// SDK client
// ---------------------------------------------------------------------------

export const twilioClient = twilio(ACCOUNT_SID ?? "", AUTH_TOKEN ?? "");

// ---------------------------------------------------------------------------
// Outbound call helper
// ---------------------------------------------------------------------------

export interface OutboundCallOptions {
  /** E.164 destination number, e.g. +14155551234 */
  to: string;
  /** Twilio URL that returns TwiML when the call is answered */
  voiceUrl: string;
  /** Twilio will POST lifecycle events here */
  statusCallbackUrl: string;
}

export interface TwilioCallResult {
  sid: string;
  status: string;
  to: string;
  from: string;
}

/**
 * Places an outbound call via Twilio.
 *
 * @returns The Twilio call SID and initial status.
 * @throws  If Twilio env vars are missing or the API call fails.
 */
export async function placeOutboundCall(
  opts: OutboundCallOptions
): Promise<TwilioCallResult> {
  if (!ACCOUNT_SID || !AUTH_TOKEN || !FROM_NUMBER) {
    throw new Error(
      "Cannot place call: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and " +
        "TWILIO_PHONE_NUMBER must all be set."
    );
  }

  // Trial Twilio accounts reject statusCallback and statusCallbackEvent.
  // We detect trial by checking TWILIO_TRIAL_ACCOUNT env var, or fall back
  // to attempting with statusCallback and retrying without it on 400.
  const isTrial = process.env.TWILIO_TRIAL_ACCOUNT === "true";

  const baseParams = {
    to: opts.to,
    from: FROM_NUMBER,
    url: opts.voiceUrl,
  };

  const fullParams = {
    ...baseParams,
    statusCallback: opts.statusCallbackUrl,
    statusCallbackMethod: "POST" as const,
  };

  let call;
  if (isTrial) {
    // Skip statusCallback for trial accounts — they reject it outright
    logger.info("twilio: trial account mode — skipping statusCallback");
    call = await twilioClient.calls.create(baseParams);
  } else {
    try {
      call = await twilioClient.calls.create(fullParams);
    } catch (err: unknown) {
      // Trial accounts return 400 "Invalid or disallowed parameters" for statusCallback.
      // Auto-detect and retry without it.
      const isTrialRestriction =
        err instanceof Error &&
        err.message.includes("disallowed parameters") &&
        (err as { status?: number }).status === 400;

      if (isTrialRestriction) {
        logger.warn(
          "twilio: statusCallback rejected (trial account?) — retrying without it. " +
            "Set TWILIO_TRIAL_ACCOUNT=true in .env to skip this retry."
        );
        call = await twilioClient.calls.create(baseParams);
      } else {
        throw err;
      }
    }
  }

  logger.info(
    { sid: call.sid, to: opts.to, status: call.status },
    "twilio: outbound call created"
  );

  return {
    sid: call.sid,
    status: call.status,
    to: call.to,
    from: call.from,
  };
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

export interface TwilioEmailResult {
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
): Promise<TwilioEmailResult> {
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
