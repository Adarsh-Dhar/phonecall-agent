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

if (!ACCOUNT_SID || !AUTH_TOKEN || !FROM_NUMBER) {
  logger.warn(
    "Twilio env vars (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER) " +
      "are not fully set — outbound calls will fail at runtime."
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

  const call = await twilioClient.calls.create({
    to: opts.to,
    from: FROM_NUMBER,
    url: opts.voiceUrl,
    statusCallback: opts.statusCallbackUrl,
    statusCallbackMethod: "POST",
    statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
    // record: true,
    // ↑ Recording is intentionally disabled. If you enable it, add an
    //   audible disclosure at the start of the call per your jurisdiction's law.
  });

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
