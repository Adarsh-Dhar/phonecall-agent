import { sendToAccount } from "./presence";
import { sendPushToAccount } from "./push";
import { logger } from "../lib/logger";

/**
 * Notifies the owner of a question by:
 * 1. Sending an in-app post_call_question event if a tab is open
 * 2. Sending a web push notification linking to /queries if no tab is open
 * This function never throws - errors are logged only.
 */
export async function notifyOwnerOfQuestion(opts: {
  ownerId: string;
  question: string;
  queryId: string;
  contactId: string;
}): Promise<void> {
  try {
    const payload = {
      type: "post_call_question" as const,
      queryId: opts.queryId,
      question: opts.question,
      contactId: opts.contactId,
    };

    const inAppSent = sendToAccount(opts.ownerId, payload);

    if (!inAppSent) {
      // No tab open, send web push
      await sendPushToAccount(opts.ownerId, {
        title: "Your call agent has a question",
        body: opts.question,
        url: "/queries",
      });
      logger.info({ ownerId: opts.ownerId, queryId: opts.queryId }, "questionNotify: sent web push");
    } else {
      logger.info({ ownerId: opts.ownerId, queryId: opts.queryId }, "questionNotify: sent in-app event");
    }
  } catch (err) {
    logger.error({ err, ownerId: opts.ownerId, queryId: opts.queryId }, "questionNotify: failed to notify owner");
  }
}
