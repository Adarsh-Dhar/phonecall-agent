/**
 * Owner fallback notifications. Order: caller already tried open tabs + web push; this is the
 * next channel. Add WhatsApp here later as another entry in the chain.
 */
import { prisma } from "@workspace/db-prisma";
import { logger } from "../../lib/logger";
import { sendEmail } from "./email";

export interface FallbackMessage {
  subject: string;
  text: string;
  /** In-app path, appended to APP_URL when set. */
  url?: string;
}

export type FallbackResult = { channel: "email" | "none"; delivered: boolean };

/** Never throws. */
export async function notifyOwnerFallback(ownerId: string, msg: FallbackMessage): Promise<FallbackResult> {
  try {
    const owner = await prisma.account.findUnique({
      where: { id: ownerId },
      select: { email: true, emailFallback: true },
    });
    if (!owner?.email || !owner.emailFallback) return { channel: "none", delivered: false };

    const link = msg.url && process.env.APP_URL ? `\n\nOpen: ${process.env.APP_URL.replace(/\/$/, "")}${msg.url}` : "";
    const delivered = await sendEmail({ to: owner.email, subject: msg.subject, text: `${msg.text}${link}` });
    return { channel: "email", delivered };
  } catch (err) {
    logger.error({ err, ownerId }, "outbound: owner fallback failed");
    return { channel: "none", delivered: false };
  }
}
