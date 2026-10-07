/**
 * Push Notification REST API
 *
 * POST /push/subscribe    — Subscribe to push notifications (authenticated)
 * GET  /push/public-key   — Get VAPID public key for service worker registration
 */

import { Router, type IRouter } from "express";
import { prisma } from "@workspace/db-prisma";
import { requireAuth } from "../lib/authMiddleware";
import { asyncHandler } from "../lib/asyncHandler";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// GET /push/public-key — Get VAPID public key for service worker registration
// ---------------------------------------------------------------------------

router.get("/push/public-key", asyncHandler(async (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    res.status(503).json({ error: "Push notifications not configured" });
    return;
  }
  res.json({ publicKey });
}, "Failed to get public key"));

// ---------------------------------------------------------------------------
// POST /push/subscribe — Subscribe to push notifications (authenticated)
// ---------------------------------------------------------------------------

router.post("/push/subscribe", requireAuth, asyncHandler(async (req, res) => {
  const { endpoint, p256dh, auth } = req.body;

  if (!endpoint || !p256dh || !auth) {
    res.status(400).json({ error: "endpoint, p256dh, and auth are required" });
    return;
  }

  const subscription = await prisma.pushSubscription.upsert({
    where: { endpoint: String(endpoint) },
    create: {
      accountId: req.userId!,
      endpoint: String(endpoint),
      p256dh: String(p256dh),
      auth: String(auth),
    },
    update: {
      p256dh: String(p256dh),
      auth: String(auth),
    },
  });

  logger.info({ subscriptionId: subscription.id, accountId: req.userId }, "push: subscription upserted");
  res.json(subscription);
}, "Failed to subscribe to push notifications"));

export default router;
