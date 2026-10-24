/**
 * Fallback messaging. The scheduler never talks to a provider; it calls one of two functions here:
 *
 *   notifyOwnerFallback()     -> the owner, after open tabs + web push could not reach them.
 *   messageBusinessFallback() -> the business contact, after the agent could not get through to them.
 *
 * Both never throw, and both write an OutboundMessage row for every attempt (audit trail and the
 * source of the rate limits below).
 */
import { prisma } from "@workspace/db-prisma";
import { logger } from "../../lib/logger";
import { sendEmail, emailConfigured } from "./email";
import { sendWhatsApp, whatsappConfigured } from "./whatsapp";
import { toE164 } from "./phone";
import { optOutUrl } from "./optOut";

export interface FallbackMessage {
  subject: string;
  text: string;
  /** In-app path, appended to APP_URL when set. */
  url?: string;
  /** Recorded on the audit row. */
  taskId?: string;
}

export type FallbackResult = { channel: "email" | "none"; delivered: boolean };

type Channel = "email" | "whatsapp";

const DAY_MS = 24 * 60 * 60 * 1000;
/** One message per task, and at most this many per contact, in any rolling 24 hours. */
export const BUSINESS_PER_CONTACT_DAILY_CAP = 2;

async function record(row: {
  ownerId: string;
  contactId?: string | null;
  taskId?: string | null;
  audience: "owner" | "business";
  channel: Channel;
  delivered: boolean;
  error?: string;
}): Promise<void> {
  try {
    await prisma.outboundMessage.create({
      data: {
        ownerId: row.ownerId,
        contactId: row.contactId ?? null,
        taskId: row.taskId ?? null,
        audience: row.audience,
        channel: row.channel,
        status: row.delivered ? "sent" : "failed",
        error: row.error ?? null,
      },
    });
  } catch (err) {
    // The audit log must never break a notification.
    logger.warn({ err }, "outbound: could not record message");
  }
}

// ── Owner ─────────────────────────────────────────────────────────────────────

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
    await record({
      ownerId,
      taskId: msg.taskId,
      audience: "owner",
      channel: "email",
      delivered,
      error: delivered ? undefined : emailConfigured() ? "provider_error" : "not_configured",
    });
    return { channel: "email", delivered };
  } catch (err) {
    logger.error({ err, ownerId }, "outbound: owner fallback failed");
    return { channel: "none", delivered: false };
  }
}

// ── Business ──────────────────────────────────────────────────────────────────

export interface BusinessFallbackInput {
  ownerId: string;
  contactId: string;
  taskId: string;
  taskTitle: string;
  attempts: number;
}

export type BusinessFallbackResult = {
  channel: Channel | "none";
  delivered: boolean;
  /** Why nothing was sent (only set when channel is "none"). */
  reason?: "not_opted_in" | "no_app_url" | "no_channel" | "rate_limited" | "error";
};

const oneLine = (s: string, max: number) => s.replace(/\s+/g, " ").trim().slice(0, max);

/**
 * The message is built from three things only: the owner's display name, the contact's own name and
 * the task title. It never includes other contacts, call transcripts, task descriptions or knowledge.
 * `short` is the single-line variant used for WhatsApp.
 */
export function buildBusinessMessage(input: {
  ownerName: string | null;
  contactName: string;
  taskTitle: string;
  attempts: number;
  optOutUrl: string;
  canReply: boolean;
}): { subject: string; text: string; short: string } {
  const owner = oneLine(input.ownerName || "", 80) || "A customer of yours";
  const title = oneLine(input.taskTitle, 140);
  const intro = `${owner} has been trying to reach you by phone about: "${title}". We tried ${input.attempts} times and could not get through.`;
  const text = [
    `Hello ${oneLine(input.contactName, 80)},`,
    "",
    intro,
    "",
    input.canReply
      ? `Please get back to ${owner} when you can; replying to this email reaches them directly.`
      : `Please get back to ${owner} when you can.`,
    "",
    `This is an automated message sent on ${owner}'s behalf by their phone assistant.`,
    `Stop these messages: ${input.optOutUrl}`,
  ].join("\n");
  return {
    subject: oneLine(`Message from ${owner}: please get back in touch`, 120),
    text,
    short: `${intro} Please get back to them when you can. Automated message. Opt out: ${input.optOutUrl}`,
  };
}

/** Never throws. Sends at most one message: the first channel that delivers wins. */
export async function messageBusinessFallback(input: BusinessFallbackInput): Promise<BusinessFallbackResult> {
  const none = (reason: NonNullable<BusinessFallbackResult["reason"]>): BusinessFallbackResult => ({
    channel: "none",
    delivered: false,
    reason,
  });
  try {
    const contact = await prisma.account.findFirst({
      where: { id: input.contactId, ownerId: input.ownerId, isService: true },
      select: { name: true, contactEmail: true, phone: true, allowFallbackMessage: true },
    });
    // Opt-in per contact. Without it nothing leaves the system.
    if (!contact?.allowFallbackMessage) return none("not_opted_in");

    // No way to opt out means no message.
    const optOut = optOutUrl(input.contactId);
    if (!optOut) return none("no_app_url");

    const channels: Channel[] = [];
    if (contact.contactEmail && emailConfigured()) channels.push("email");
    const e164 = toE164(contact.phone);
    if (e164 && whatsappConfigured()) channels.push("whatsapp");
    if (channels.length === 0) return none("no_channel");

    const since = new Date(Date.now() - DAY_MS);
    const base = { audience: "business", status: "sent", createdAt: { gte: since } };
    const [forTask, forContact] = await Promise.all([
      prisma.outboundMessage.count({ where: { ...base, taskId: input.taskId } }),
      prisma.outboundMessage.count({ where: { ...base, contactId: input.contactId } }),
    ]);
    if (forTask >= 1 || forContact >= BUSINESS_PER_CONTACT_DAILY_CAP) return none("rate_limited");

    const owner = await prisma.account.findUnique({
      where: { id: input.ownerId },
      select: { name: true, email: true },
    });
    const msg = buildBusinessMessage({
      ownerName: owner?.name ?? null,
      contactName: contact.name || "there",
      taskTitle: input.taskTitle,
      attempts: input.attempts,
      optOutUrl: optOut,
      canReply: !!owner?.email,
    });

    for (const channel of channels) {
      const delivered =
        channel === "email"
          ? await sendEmail({
              to: contact.contactEmail!,
              subject: msg.subject,
              text: msg.text,
              ...(owner?.email ? { replyTo: owner.email } : {}),
              headers: {
                "List-Unsubscribe": `<${optOut}>`,
                "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
              },
            })
          : await sendWhatsApp({ to: e164!, text: msg.short });
      await record({
        ownerId: input.ownerId,
        contactId: input.contactId,
        taskId: input.taskId,
        audience: "business",
        channel,
        delivered,
        error: delivered ? undefined : "provider_error",
      });
      if (delivered) return { channel, delivered: true };
    }
    return none("error");
  } catch (err) {
    logger.error({ err, contactId: input.contactId }, "outbound: business fallback failed");
    return none("error");
  }
}
