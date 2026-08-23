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
