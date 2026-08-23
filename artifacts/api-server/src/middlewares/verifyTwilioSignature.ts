/**
 * Twilio request-signature verification middleware
 *
 * Every webhook Twilio sends carries an `X-Twilio-Signature` header that is
 * an HMAC-SHA1 of the full request URL + sorted POST params, signed with your
 * Auth Token. We validate it here before any route handler runs.
 *
 * IMPORTANT — the URL used for validation must exactly match what Twilio
 * called, which means it must be built from PUBLIC_BASE_URL (the public-facing
 * host) not from `req.headers.host` (the local listener). Set PUBLIC_BASE_URL
 * to your ngrok HTTPS URL in local dev; to your production domain in prod.
 *
 * Set SKIP_TWILIO_SIGNATURE_CHECK=true to bypass this in local dev when you
 * are not forwarding through a real tunnel (e.g. curl testing). Never enable
 * this in production.
 */

import twilio from "twilio";
import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

export function verifyTwilioSignature(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Allow bypassing in local dev — never in production
  if (process.env.SKIP_TWILIO_SIGNATURE_CHECK === "true") {
    if (process.env.NODE_ENV === "production") {
      logger.error(
        "SKIP_TWILIO_SIGNATURE_CHECK is set in production — refusing to bypass"
      );
      res.status(500).json({ error: "Server misconfiguration" });
      return;
    }
    logger.warn(
      "verifyTwilioSignature: signature check skipped (SKIP_TWILIO_SIGNATURE_CHECK=true)"
    );
    next();
    return;
  }

  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const publicBaseUrl = process.env.PUBLIC_BASE_URL;

  if (!authToken || !publicBaseUrl) {
    logger.error(
      "verifyTwilioSignature: TWILIO_AUTH_TOKEN or PUBLIC_BASE_URL is not set"
    );
    res.status(500).json({ error: "Server misconfiguration" });
    return;
  }

  const signature = req.headers["x-twilio-signature"] as string | undefined;

  if (!signature) {
    logger.warn({ url: req.originalUrl }, "verifyTwilioSignature: missing signature header");
    res.status(403).json({ error: "Missing Twilio signature" });
    return;
  }

  // Build the full URL exactly as Twilio targeted it.
  // req.originalUrl includes the path + query string (e.g. /api/twilio/voice).
  const url = `${publicBaseUrl}${req.originalUrl}`;

  // req.body is already parsed as an object by express.urlencoded() for Twilio's
  // form-encoded webhooks. Pass it directly — twilio.validateRequest handles
  // both form-encoded and JSON payloads.
  const params = (req.body ?? {}) as Record<string, string>;

  const valid = twilio.validateRequest(authToken, signature, url, params);

  if (!valid) {
    logger.warn(
      { url, signature: signature.slice(0, 8) + "…" },
      "verifyTwilioSignature: invalid signature — request rejected"
    );
    res.status(403).json({ error: "Invalid Twilio signature" });
    return;
  }

  next();
}
