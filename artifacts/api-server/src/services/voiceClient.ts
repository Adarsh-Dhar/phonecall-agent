/**
 * Voice client service — outbound call origination via Exotel's Voice API.
 *
 * Exotel does not do per-call dynamic call flow like Twilio's TwiML. The
 * call flow (which applets run, in what order — including the Voicebot
 * Applet that streams audio to us) is built once in the Exotel App Bazaar
 * dashboard and referenced here only by its App ID.
 */

import { logger } from "../lib/logger";

const {
  EXOTEL_SID,
  EXOTEL_API_KEY,
  EXOTEL_API_TOKEN,
  EXOTEL_SUBDOMAIN = "api.exotel.com",
  EXOTEL_CALLER_ID,
  EXOTEL_APP_ID,
  EXOTEL_MOCK_MODE = "false",
} = process.env;

const MOCK_MODE = EXOTEL_MOCK_MODE === "true";

if (!MOCK_MODE && (!EXOTEL_SID || !EXOTEL_API_KEY || !EXOTEL_API_TOKEN || !EXOTEL_CALLER_ID || !EXOTEL_APP_ID)) {
  logger.warn(
    "voiceClient: Exotel env vars are not fully set (EXOTEL_SID, EXOTEL_API_KEY, " +
      "EXOTEL_API_TOKEN, EXOTEL_CALLER_ID, EXOTEL_APP_ID) — outbound calls will fail at runtime."
  );
}

const base = () => `https://${EXOTEL_SUBDOMAIN}/v1/Accounts/${EXOTEL_SID}`;
const flowUrl = () => `http://my.exotel.com/${EXOTEL_SID}/exoml/start_voice/${EXOTEL_APP_ID}`;

export interface PlacedCall {
  sid: string;
  status: string;
}

/**
 * Places an outbound call: Exotel first rings `toNumber`, and once answered,
 * connects that leg into the App Bazaar flow identified by EXOTEL_APP_ID
 * (which contains the Voicebot Applet our WebSocket server talks to).
 */
export async function placeOutboundCall(toNumber: string): Promise<PlacedCall> {
  // Mock mode for development - simulates a successful call without hitting Exotel API
  if (MOCK_MODE) {
    logger.info({ toNumber }, "voiceClient: MOCK MODE - simulating outbound call");
    // Simulate a delay to mimic network latency
    await new Promise(resolve => setTimeout(resolve, 500));
    const mockSid = `MOCK_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    return { sid: mockSid, status: "in-progress" };
  }

  if (!EXOTEL_SID || !EXOTEL_API_KEY || !EXOTEL_API_TOKEN || !EXOTEL_CALLER_ID || !EXOTEL_APP_ID) {
    throw new Error("Cannot place call: Exotel env vars are not fully configured.");
  }

  const body = new URLSearchParams({
    From: EXOTEL_CALLER_ID,
    To: toNumber,
    Url: flowUrl(),
  });

  const res = await fetch(`${base()}/Calls/connect.json`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${EXOTEL_API_KEY}:${EXOTEL_API_TOKEN}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = (await res.json()) as { Call?: { Sid: string; Status: string }; RestException?: { Message: string } };

  if (!res.ok || !data.Call) {
    const message = data.RestException?.Message ?? `Exotel call request failed (${res.status})`;
    logger.error({ status: res.status, toNumber, message }, "voiceClient: placeOutboundCall failed");
    throw new Error(message);
  }

  logger.info({ sid: data.Call.Sid, status: data.Call.Status, toNumber }, "voiceClient: outbound call placed");
  return { sid: data.Call.Sid, status: data.Call.Status };
}