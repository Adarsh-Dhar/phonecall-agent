import { prisma } from "@workspace/db-prisma";
import { logger } from "../lib/logger";
import { sendEmail } from "./outbound/email";
import { sendToAccount } from "./presence";
import { sendPush } from "./push";
import { localAt } from "./taskKinds";

/**
 * Get items waiting for the owner's input.
 */
async function getWaitingOnYou(ownerId: string, since: Date | null): Promise<{
  pendingQueries: number;
  waitingTasks: number;
  expiredHandoffs: number;
}> {
  // Get pending queries from contacts
  const pendingQueries = await prisma.query.count({
    where: {
      contact: { ownerId },
      status: "pending",
    },
  });

  // Get tasks waiting for user input or suggested
  const waitingTasks = await prisma.task.count({
    where: {
      contact: { ownerId },
      status: { in: ["waiting_user", "suggested"] },
    },
  });

  // Get expired handoffs since last digest
  const expiredHandoffs = await prisma.handoff.count({
    where: {
      ownerId,
      status: "expired",
      requestedAt: since ? { gte: since } : undefined,
    },
  });

  return { pendingQueries, waitingTasks, expiredHandoffs };
}

/**
 * Run the digest cycle. Fire-and-forget: called from the scheduler, never delays dialing.
 */
export async function runDigestCycle(now = new Date()): Promise<void> {
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
        timezone: true,
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
    timezone: string | null;
  },
  now: Date
): Promise<void> {
  // Check if it's time for this owner's digest using their timezone
  const tz = owner.timezone || "UTC";
  const due = localAt(now, tz, 0, owner.digestHour);
  if (now < due || (owner.lastDigestAt && owner.lastDigestAt >= due)) {
    return;
  }

  // Get "waiting on you" items first - always include these even if no calls
  const waitingOnYou = await getWaitingOnYou(owner.id, owner.lastDigestAt);

  // If nothing to report, skip
  const totalWaiting = waitingOnYou.pendingQueries + waitingOnYou.waitingTasks + waitingOnYou.expiredHandoffs;
  if (totalWaiting === 0 && !owner.email) {
    logger.info({ ownerId: owner.id }, "ownerDigest: nothing to report and no email configured");
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
      contactId: true,
    },
    orderBy: { startedAt: "desc" },
    take: 20,
  });

  // If no calls and nothing waiting, skip
  if (calls.length === 0 && totalWaiting === 0) {
    logger.info({ ownerId: owner.id }, "ownerDigest: no calls and nothing waiting");
    return;
  }

  // If no email configured but there are waiting items, log and return
  if (!owner.email) {
    logger.warn({ ownerId: owner.id, waitingOnYou }, "ownerDigest: items waiting but no email configured");
    return;
  }

  // Get contact names
  const contactIds = calls.map((c) => c.contactId);
  const contacts = await prisma.account.findMany({
    where: { id: { in: contactIds } },
    select: { id: true, name: true },
  });
  const contactMap = new Map(contacts.map((c) => [c.id, c.name]));

  // Build digest content
  const callsWithContact = calls.map((c) => ({
    outcome: c.outcome,
    outcomeSummary: c.outcomeSummary,
    startedAt: c.startedAt!,
    durationSec: c.durationSec,
    qualityScore: c.qualityScore,
    contact: { name: contactMap.get(c.contactId) || "Unknown" },
  }));
  const summary = buildDigestSummary(callsWithContact, waitingOnYou, owner.name || "there");

  // Send email
  const sent = await sendDigestEmail(owner.email, summary);
  if (!sent) {
    logger.warn({ ownerId: owner.id }, "ownerDigest: email not configured or failed");
    return; // Don't advance lastDigestAt if email failed
  }

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
    contact: { name: string } | null;
  }>,
  waitingOnYou: {
    pendingQueries: number;
    waitingTasks: number;
    expiredHandoffs: number;
  },
  ownerName: string
): string {
  const successful = calls.filter((c) => c.outcome === "booked" || c.outcome === "rescheduled").length;
  const neededUser = calls.filter((c) => c.outcome === "needs_user").length;
  const failed = calls.filter((c) => c.outcome === "failed").length;

  let text = `Hi ${ownerName},\n\n`;
  text += `Your agent handled ${calls.length} call${calls.length !== 1 ? "s" : ""} since your last digest:\n\n`;
  text += `- ${successful} successful${neededUser ? `, ${neededUser} needed your input` : ""}${failed ? `, ${failed} failed` : ""}\n\n`;

  // "Waiting on you" section
  if (waitingOnYou.pendingQueries > 0 || waitingOnYou.waitingTasks > 0 || waitingOnYou.expiredHandoffs > 0) {
    text += "WAITING ON YOU:\n";
    if (waitingOnYou.pendingQueries > 0) {
      text += `- ${waitingOnYou.pendingQueries} pending question${waitingOnYou.pendingQueries !== 1 ? "s" : ""} from contacts\n`;
    }
    if (waitingOnYou.waitingTasks > 0) {
      text += `- ${waitingOnYou.waitingTasks} task${waitingOnYou.waitingTasks !== 1 ? "s" : ""} waiting for your input or suggested\n`;
    }
    if (waitingOnYou.expiredHandoffs > 0) {
      text += `- ${waitingOnYou.expiredHandoffs} handoff${waitingOnYou.expiredHandoffs !== 1 ? "s" : ""} expired (you weren't available)\n`;
    }
    text += "\n";
  }

  if (neededUser > 0) {
    text += "CALLS WAITING FOR YOUR INPUT:\n";
    const waitingCalls = calls.filter((c) => c.outcome === "needs_user");
    for (const call of waitingCalls) {
      const contact = call.contact?.name || "Unknown";
      text += `- ${contact}: ${call.outcomeSummary || "Needs your decision"}\n`;
    }
    text += "\n";
  }

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

async function sendDigestEmail(email: string, content: string): Promise<boolean> {
  return await sendEmail({
    to: email,
    subject: "Your agent call digest",
    text: content,
  });
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
        contactId: true,
      },
    });

    if (!call || !call.autonomous) return;

    const contact = call.contactId ? await prisma.account.findUnique({
      where: { id: call.contactId },
      select: { name: true },
    }) : null;

    const contactName = contact?.name || "a business";
    const message = `Your agent finished a call with ${contactName}. Outcome: ${call.outcome || "unknown"}. ${call.outcomeSummary || ""}`;

    // Send via presence (real-time)
    const live = call.individualId ? sendToAccount(call.individualId, {
      type: "agent_call_done",
      callId,
      contactName: contactName || "a business",
      outcome: call.outcome,
      summary: call.outcomeSummary,
    }) : false;

    // Fallback to push if not delivered
    if (!live && call.individualId) {
      await sendPush(call.individualId, {
        type: "agent_call_done",
        contactName: contactName || "a business",
        outcome: call.outcome,
        summary: call.outcomeSummary,
      }).catch((err) => logger.error({ err }, "ownerDigest: failed to send push notification"));
    }

    logger.info({ callId, message }, "ownerDigest: per-call notification sent");
  } catch (err) {
    logger.error({ err, callId }, "ownerDigest: failed to notify of call completion");
  }
}
