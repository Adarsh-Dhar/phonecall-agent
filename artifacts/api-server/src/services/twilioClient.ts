/**
 * Twilio client service
 *
 * Wraps the Twilio REST SDK and exposes a single `placeOutboundCall()` helper.
 * The raw `twilioClient` is also exported for any one-off SDK calls (e.g.
 * updating call status, fetching recordings).
 *
 * Fails fast at import time if the required env vars are missing so the
 * server surfaces the misconfiguration immediately on startup rather than at
 * the first real call attempt.
 */

import twilio from "twilio";
import { logger } from "../lib/logger";

// ---------------------------------------------------------------------------
// Validate env vars once at module load
// ---------------------------------------------------------------------------

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const FROM_EMAIL = process.env.TWILIO_EMAIL_ADDRESS;

if (!ACCOUNT_SID || !AUTH_TOKEN || !FROM_NUMBER) {
  logger.warn(
    "Twilio env vars (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER) " +
      "are not fully set — outbound calls will fail at runtime."
  );
}

if (!ACCOUNT_SID || !AUTH_TOKEN || !FROM_EMAIL) {
  logger.warn(
    "Twilio env vars (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_EMAIL_ADDRESS) " +
      "are not fully set — outbound emails will fail at runtime."
  );
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
// Outbound email helper (Twilio Email API)
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
  /** Optional sender name (defaults to "Trial with Twilio" if not provided) */
  fromName?: string;
}

export interface TwilioEmailResult {
  sid: string;
  status: string;
  to: string;
  from: string;
}

interface TwilioEmailApiResponse {
  sid: string;
  status: string;
}

/**
 * Sends an outbound email via Twilio Email API.
 *
 * @returns The email SID/message ID and initial status.
 * @throws  If API keys are missing or the API call fails.
 */
export async function sendOutboundEmail(
  opts: OutboundEmailOptions
): Promise<TwilioEmailResult> {
  if (!ACCOUNT_SID || !AUTH_TOKEN || !FROM_EMAIL) {
    throw new Error(
      "Cannot send email: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and " +
        "TWILIO_EMAIL_ADDRESS must all be set."
    );
  }

  if (!opts.body && !opts.html) {
    throw new Error("Either body (plain text) or html (HTML) must be provided.");
  }

  const fromName = opts.fromName || "Trial with Twilio";

  const emailData = {
    from: {
      address: FROM_EMAIL,
      name: fromName,
    },
    to: [
      {
        address: opts.to,
      },
    ],
    content: {
      subject: opts.subject,
      ...(opts.body && { text: opts.body }),
      ...(opts.html && { html: opts.html }),
    },
  };

  try {
    const response = await fetch("https://comms.twilio.com/v1/Emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString("base64")}`,
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Twilio Email API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json() as TwilioEmailApiResponse;

    logger.info(
      { sid: result.sid, to: opts.to, status: result.status },
      "twilio: outbound email sent"
    );

    return {
      sid: result.sid,
      status: result.status,
      to: opts.to,
      from: FROM_EMAIL,
    };
  } catch (err) {
    logger.error({ err, to: opts.to }, "twilio: sendOutboundEmail failed");
    throw err;
  }
}
