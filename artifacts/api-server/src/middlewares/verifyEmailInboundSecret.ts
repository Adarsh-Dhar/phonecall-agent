/**
 * SendGrid/Twilio's Inbound Parse webhook has no X-Twilio-Signature — that
 * header only exists on the voice/SMS webhook surface, not on Inbound Parse
 * POSTs. So instead we verify a shared secret passed as a query param on
 * the Destination URL you configure in the console, e.g.:
 *   https://your-domain/api/emails/inbound?token=<EMAIL_INBOUND_SECRET>
 */

import type { NextFunction, Request, Response } from "express";
import { logger } from "../lib/logger";

export function verifyEmailInboundSecret(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.EMAIL_INBOUND_SECRET;
  if (!expected || expected === "change_me_to_a_long_random_value") {
    logger.error("verifyEmailInboundSecret: EMAIL_INBOUND_SECRET not configured — rejecting");
    res.status(500).send("Inbound email not configured");
    return;
  }

  const provided = req.query.token;
  if (provided !== expected) {
    logger.warn("verifyEmailInboundSecret: invalid or missing token, rejecting");
    res.status(403).send("Invalid token");
    return;
  }

  next();
}
