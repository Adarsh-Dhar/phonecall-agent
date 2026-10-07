import webpush from "web-push";
import { prisma } from "@workspace/db-prisma";
import { logger } from "../lib/logger";

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:contact@example.com";

if (!vapidPublicKey || !vapidPrivateKey) {
  logger.warn("push: VAPID keys not configured, push notifications disabled");
} else {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export async function sendPushToAccount(accountId: string, payload: PushPayload): Promise<boolean> {
  if (!vapidPublicKey || !vapidPrivateKey) {
    return false;
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { accountId },
  });

  if (subscriptions.length === 0) {
    return false;
  }

  let success = false;
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        JSON.stringify(payload)
      );
      success = true;
    } catch (err: any) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } });
        logger.info({ subscriptionId: sub.id }, "push: deleted stale subscription");
      } else {
        logger.error({ err, subscriptionId: sub.id }, "push: failed to send notification");
      }
    }
  }

  return success;
}
