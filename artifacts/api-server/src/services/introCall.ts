/**
 * Intro call: when an individual and a business have each saved the other, queue ONE call task so the
 * individual's agent introduces itself and learns the basics. The scheduler does the rest (hours,
 * closures, retries, agent-mode fallback); consolidation and extraction run after the call as usual.
 *
 * queueIntroCall never throws. It is safe to call after every "add contact" (only the second add of a
 * pair does anything) and safe to call twice at once (the claim is a conditional updateMany).
 */
import { prisma } from "@workspace/db-prisma";
import { logger } from "../lib/logger";
import { getOrCreateRelationship } from "./memory/relationship";

export const INTRO_PURPOSE = "intro";
const HOUR_MS = 3_600_000;
const SPREAD_MS = 2 * 60_000;

const enabled = () => process.env.INTRO_CALL_ENABLED === "true";
const hourlyCap = () => Number(process.env.INTRO_CALL_MAX_PER_BUSINESS_HOUR) || 10;

export function isIntroTask(task: { meta?: unknown } | null | undefined): boolean {
  const meta = task?.meta;
  return !!meta && typeof meta === "object" && (meta as Record<string, unknown>).purpose === INTRO_PURPOSE;
}

export type QueueIntroResult = { queued: boolean; reason?: string; taskId?: string };

export async function queueIntroCall(ownerId: string, targetId: string, now = new Date()): Promise<QueueIntroResult> {
  try {
    if (!enabled()) return { queued: false, reason: "disabled" };

    const [owner, target] = await Promise.all([
      prisma.account.findUnique({ where: { id: ownerId }, select: { id: true, isService: true, agentMode: true, name: true } }),
      prisma.account.findUnique({ where: { id: targetId }, select: { id: true, isService: true, agentMode: true, name: true } }),
    ]);
    if (!owner || !target || owner.isService === target.isService) return { queued: false, reason: "not_a_pair" };
    const individual = owner.isService ? target : owner;
    const business = owner.isService ? owner : target;

    // Both sides must hold the other (the same rule as isContact in callSignaling.ts).
    const [individualContact, businessContact] = await Promise.all([
      prisma.account.findFirst({
        where: { ownerId: individual.id, linkedAccountId: business.id, isService: true },
        select: { id: true, name: true, conversations: { select: { id: true }, orderBy: { createdAt: "asc" }, take: 1 } },
      }),
      prisma.account.findFirst({
        where: { ownerId: business.id, linkedAccountId: individual.id, isService: true },
        select: { id: true },
      }),
    ]);
    if (!individualContact || !businessContact) return { queued: false, reason: "not_mutual" };

    const relationship = await getOrCreateRelationship({
      individualId: individual.id,
      businessId: business.id,
      contactId: individualContact.id,
    });

    // Claim once per pair. Two adds at the same moment: only one updateMany matches.
    const claim = await prisma.relationship.updateMany({
      where: { id: relationship.id, introStatus: "none" },
      data: { introStatus: "queued", introQueuedAt: now },
    });
    if (claim.count === 0) return { queued: false, reason: "already_handled" };

    try {
      // Bulk adds: past the hourly cap, space the extra calls out instead of ringing the business at once.
      const recent = await prisma.relationship.count({
        where: { businessId: business.id, introQueuedAt: { gte: new Date(+now - HOUR_MS) } },
      });
      const dueAt = new Date(+now + Math.max(0, recent - hourlyCap()) * SPREAD_MS);

      const conversationId =
        individualContact.conversations[0]?.id ??
        (await prisma.conversation.create({
          data: { contactId: individualContact.id, title: `Chat with ${individualContact.name ?? "contact"}` },
          select: { id: true },
        })).id;

      const businessName = individualContact.name ?? business.name ?? "the business";
      const task = await prisma.task.create({
        data: {
          title: `Introduce yourself to ${businessName}`,
          description:
            `${individual.name ?? "Your user"} and ${businessName} have just added each other. ` +
            "Introduce yourself as their assistant and learn the basics: what they offer, how booking works, " +
            "usual hours, prices and deposits, what a new client should bring, and how they prefer to be contacted.",
          kind: "call",
          status: individual.agentMode ? "open" : "suggested",
          source: "agent",
          confidence: 1,
          conversationId,
          contactId: individualContact.id,
          dueDate: dueAt,
          nextAttemptAt: dueAt,
          callAttempts: 0,
          schedulerStatus: "pending",
          meta: { purpose: INTRO_PURPOSE },
        },
        select: { id: true },
      });
      await prisma.relationship.update({ where: { id: relationship.id }, data: { introTaskId: task.id } });
      logger.info({ individualId: individual.id, businessId: business.id, taskId: task.id }, "introCall: queued");
      return { queued: true, taskId: task.id };
    } catch (err) {
      // Give the claim back so a later add can try again.
      await prisma.relationship.updateMany({ where: { id: relationship.id }, data: { introStatus: "none", introQueuedAt: null } }).catch(() => {});
      throw err;
    }
  } catch (err) {
    logger.error({ err, ownerId, targetId }, "introCall: failed to queue");
    return { queued: false, reason: "error" };
  }
}

/** Called when either side deletes the contact before the intro call has finished. Never throws. */
export async function cancelIntroCall(individualId: string, businessId: string): Promise<void> {
  try {
    const rel = await prisma.relationship.findUnique({
      where: { individualId_businessId: { individualId, businessId } },
      select: { id: true, introStatus: true, introTaskId: true },
    });
    if (!rel || rel.introStatus !== "queued") return;
    if (rel.introTaskId) {
      await prisma.task.updateMany({
        where: { id: rel.introTaskId, status: { in: ["open", "suggested", "waiting_user"] } },
        data: { status: "cancelled", schedulerStatus: "done" },
      });
    }
    await prisma.relationship.update({ where: { id: rel.id }, data: { introStatus: "cancelled" } });
  } catch (err) {
    logger.error({ err, individualId, businessId }, "introCall: cancel failed");
  }
}

const DONE_OUTCOMES = ["booked", "rescheduled", "cancelled", "info_gathered", "needs_user"];

/**
 * Called after every call outcome (and when a task runs out of attempts). A no-op unless the task is
 * the intro task of a relationship. `final_failure` = no attempts left.
 */
export async function recordIntroOutcome(taskId: string, outcome: string | null): Promise<void> {
  try {
    const next =
      outcome === "final_failure" ? "failed" : outcome && DONE_OUTCOMES.includes(outcome) ? "done" : null;
    if (!next) return;
    await prisma.relationship.updateMany({
      where: { introTaskId: taskId, introStatus: "queued" },
      data: { introStatus: next },
    });
  } catch (err) {
    logger.error({ err, taskId }, "introCall: could not record outcome");
  }
}
