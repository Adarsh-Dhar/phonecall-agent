import type { NextFunction, Request, Response } from "express";
import { logger } from "../lib/logger";

export function verifyCallPassthruSecret(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.EXOTEL_PASSTHRU_SECRET;
  if (!expected || expected === "change_me_to_a_long_random_value") {
    logger.error("verifyCallPassthruSecret: EXOTEL_PASSTHRU_SECRET not configured — rejecting");
    res.status(500).send("Call passthru not configured");
    return;
  }

  if (req.query.token !== expected) {
    logger.warn("verifyCallPassthruSecret: invalid or missing token, rejecting");
    res.status(403).send("Invalid token");
    return;
  }

  next();
}