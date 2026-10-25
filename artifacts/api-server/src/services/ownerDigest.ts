import { prisma } from "@workspace/db-prisma";
import { logger } from "../lib/logger";

const DIGEST_CLAIM_TTL_MS = 10 * 60 * 1000; // 10 minutes
let lastDigestRun = 0;

/**
 * Run the digest cycle. Throttled to once per 10 minutes per owner.
 * Fire-and-forget: called from the scheduler, never delays dialing.
 */
export async function runDigestCycle(now = new Date()): Promise<void> {
  const nowMs = now.getTime();
  if (nowMs - lastDigestRun < DIGEST_CLAIM_TTL_MS) {
    return;
  }
  lastDigestRun = nowMs;

  try {
    // Find owners with digest enabled and who have autonomous calls since last digest
    const owners = await prisma.account.findMany({
      where: {
        agentMode: true,
        digestMode: { not: "off" },
      },
      select: {
        id: true,
        email: true,
        name: true,
        digestMode: true,
        digestHour: true,
        lastDigestAt: true,
      },
    });

    for (const owner of owners) {
      await runOwnerDigest(owner, now).catch((err) =>
        logger.error({ err, ownerId: owner.id }, "ownerDigest: failed for owner")
      );
    }
  } catch (err) {
    logger.error({ err }, "ownerDigest: cycle failed");
  }
}

async function runOwnerDigest(
  owner: {
    id: string;
    email: string | null;
    name: string | null;
    digestMode: string;
    digestHour: number;
    lastDigestAt: Date | null;
  },
  now: Date
): Promise<void> {
  if (!owner.email) return;

  // Check if it's time for this owner's digest
  const hour = now.getHours();
  if (owner.digestMode === "daily" && hour !== owner.digestHour) {
    return;
  }

  // Find autonomous calls since last digest
  const since = owner.lastDigestAt || new Date(Date.now() - 24 * 60 * 60 * 1000);
  const calls = await prisma.call.findMany({
    where: {
      individualId: owner.id,
      autonomous: true,
      startedAt: { gte: since },
      status: "completed",
    },
    select: {
      id: true,
      outcome: true,
      outcomeSummary: true,
      startedAt: true,
      durationSec: true,
      qualityScore: true,
      contact: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { startedAt: "desc" },
    take: 20,
  });

  if (calls.length === 0) return;

  // Build digest content
  const summary = buildDigestSummary(calls, owner.name || "there");

  // Send email (placeholder - integrate with your email service)
  await sendDigestEmail(owner.email, summary).catch((err) =>
    logger.error({ err, ownerId: owner.id }, "ownerDigest: failed to send email")
  );

  // Update last digest time
  await prisma.account.update({
    where: { id: owner.id },
    data: { lastDigestAt: now },
  });

  logger.info({ ownerId: owner.id, callCount: calls.length }, "ownerDigest: sent digest");
}

function buildDigestSummary(
  calls: Array<{
    outcome: string | null;
    outcomeSummary: string | null;
    startedAt: Date;
    durationSec: number | null;
    qualityScore: number | null;
    contact: { name: string | null } | null;
  }>,
  ownerName: string
): string {
  const successful = calls.filter((c) => c.outcome === "booked" || c.outcome === "rescheduled").length;
  const neededUser = calls.filter((c) => c.outcome === "needs_user").length;
  const failed = calls.filter((c) => c.outcome === "failed").length;

  let text = `Hi ${ownerName},\n\n`;
  text += `Your agent handled ${calls.length} call${calls.length !== 1 ? "s" : ""} since your last digest:\n\n`;
  text += `- ${successful} successful${neededUser ? `, ${neededUser} needed your input` : ""}${failed ? `, ${failed} failed` : ""}\n\n`;

  text += "Details:\n";
  for (const call of calls) {
    const time = call.startedAt.toLocaleString();
    const contact = call.contact?.name || "Unknown";
    const outcome = call.outcome || "unknown";
    const duration = call.durationSec ? `${Math.round(call.durationSec / 60)}m` : "unknown";
    const quality = call.qualityScore ? `${call.qualityScore}/100` : "N/A";

    text += `\n${time} — ${contact} (${duration}, quality ${quality})\n`;
    text += `  Outcome: ${outcome}\n`;
    if (call.outcomeSummary) {
      text += `  ${call.outcomeSummary}\n`;
    }
  }

  text += "\nCheck your app for full transcripts and action items.\n";
  return text;
}

async function sendDigestEmail(email: string, content: string): Promise<void> {
  // Placeholder: integrate with your email service (e.g., SendGrid, AWS SES, etc.)
  logger.info({ email, contentLength: content.length }, "ownerDigest: would send email");
  // Example:
  // await sendgrid.send({ to: email, subject: "Your agent call digest", text: content });
}

/**
 * Notify the owner immediately after an autonomous call completes.
 * Used for per-call real-time notifications.
 */
export async function notifyAgentCallDone(callId: string): Promise<void> {
  try {
    const call = await prisma.call.findUnique({
      where: { id: callId },
      select: {
        outcome: true,
        outcomeSummary: true,
        autonomous: true,
        individualId: true,
        contact: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!call || !call.autonomous) return;

    const message = `Your agent finished a call with ${call.contact?.name || "a business"}. Outcome: ${call.outcome || "unknown"}. ${call.outcomeSummary || ""}`;

    // Send via presence (real-time)
    // Note: you may want to send this via push or email depending on preferences
    logger.info({ callId, message }, "ownerDigest: per-call notification sent");
  } catch (err) {
    logger.error({ err, callId }, "ownerDigest: failed to notify of call completion");
  }
}
