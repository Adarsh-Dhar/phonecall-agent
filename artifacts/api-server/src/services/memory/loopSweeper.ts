/**
 * Acts on open loops that have gone overdue. Called once per scheduler cycle (checkDueTasks).
 *
 *   1. awaiting_business + overdue (dueAt + grace passed)  ->  one "Check in" call task.
 *        agent mode ON  : task is "open"      -> the scheduler dials it (same hours/closure rules)
 *        agent mode OFF : task is "suggested" -> the owner decides
 *   2. awaiting_owner (queries) + overdue       ->  escalate via push notification
 *   3. scheduled (tasks) + overdue with no dueDate -> mark as stale
 *   4. loops whose follow-up task finished     ->  resolved (done) or expired (cancelled / exhausted / stale)
 *   5. loops still open long after their date  ->  expired
 *
 * Multi-instance safe: a loop is claimed with a conditional updateMany before any task is created.
 * Never throws.
 */
import { prisma } from "@workspace/db-prisma";
import { logger } from "../../lib/logger";
import { sendPush } from "../push";

export const CHECKIN_GRACE_MS = (Number(process.env.LOOP_CHECKIN_GRACE_MIN) || 120) * 60_000;
export const LOOP_EXPIRE_MS = (Number(process.env.LOOP_EXPIRE_DAYS) || 14) * 24 * 3600_000;
const QUERY_OVERDUE_MS = (Number(process.env.QUERY_OVERDUE_HOURS) || 24) * 60 * 60_000;
const BATCH = 25;
const ACTIVE = ["suggested", "open", "in_progress", "waiting_user"];

export interface SweepResult {
  created: number;
  resolved: number;
  expired: number;
  escalated: number;
}

export async function sweepOverdueLoops(now = new Date()): Promise<SweepResult> {
  const result: SweepResult = { created: 0, resolved: 0, expired: 0, escalated: 0 };
  try {
    result.created = await createCheckIns(now);
    result.escalated = await escalateOverdueQueries(now);
    result.escalated += await staleTasksWithoutDueDate(now);
    const r = await reconcileFollowUps();
    result.resolved = r.resolved;
    result.expired = r.expired + (await expireAncient(now));
    if (result.created || result.resolved || result.expired || result.escalated) logger.info(result, "loopSweeper: cycle done");
  } catch (err) {
    logger.error({ err }, "loopSweeper: sweep failed");
  }
  return result;
}

async function createCheckIns(now: Date): Promise<number> {
  const due = await prisma.openLoop.findMany({
    where: {
      status: "open",
      kind: "awaiting_business",
      followUpTaskId: null,
      lastActionAt: null,
      dueAt: { not: null, lte: new Date(+now - CHECKIN_GRACE_MS) },
    },
    orderBy: { dueAt: "asc" },
    take: BATCH,
    include: { relationship: { select: { individualId: true, contactId: true, individual: { select: { agentMode: true } } } } },
  });

  let created = 0;
  for (const loop of due) {
    // Claim first: only one instance proceeds.
    const claim = await prisma.openLoop.updateMany({
      where: { id: loop.id, status: "open", followUpTaskId: null, lastActionAt: null },
      data: { lastActionAt: now },
    });
    if (claim.count === 0) continue;

    try {
      const contactId = loop.relationship.contactId;
      const conversationId = await conversationFor(loop.sourceCallId, contactId);
      if (!conversationId) throw new Error("no conversation for contact");

      const title = `Check in: ${loop.text}`.slice(0, 200);
      const existing = await prisma.task.findFirst({
        where: { contactId, kind: "call", title, status: { in: ACTIVE } },
        select: { id: true },
      });
      const taskId =
        existing?.id ??
        (
          await prisma.task.create({
            data: {
              title,
              description: `They promised: "${loop.text}" (due ${loop.dueAt?.toISOString()}). Nothing has come through, so check in.`,
              kind: "call",
              status: loop.relationship.individual.agentMode ? "open" : "suggested",
              source: "agent",
              confidence: 0.9,
              conversationId,
              contactId,
              dueDate: now,
              nextAttemptAt: now,
              callAttempts: 0,
              schedulerStatus: "pending",
            },
          })
        ).id;
      await prisma.openLoop.update({ where: { id: loop.id }, data: { followUpTaskId: taskId } });
      created++;
    } catch (err) {
      logger.error({ err, loopId: loop.id }, "loopSweeper: check-in creation failed, will retry");
      await prisma.openLoop.update({ where: { id: loop.id }, data: { lastActionAt: null } }).catch(() => {});
    }
  }
  return created;
}

async function conversationFor(sourceCallId: string | null, contactId: string): Promise<string | null> {
  if (sourceCallId) {
    const c = await prisma.call.findUnique({ where: { id: sourceCallId }, select: { conversationId: true } });
    if (c?.conversationId) return c.conversationId;
  }
  const conv = await prisma.conversation.findFirst({ where: { contactId }, orderBy: { updatedAt: "desc" }, select: { id: true } });
  return conv?.id ?? null;
}

/** Close loops whose follow-up task has reached an end state. */
async function reconcileFollowUps(): Promise<{ resolved: number; expired: number }> {
  const loops = await prisma.openLoop.findMany({
    where: { status: "open", followUpTaskId: { not: null } },
    select: { id: true, followUpTaskId: true },
    take: 200,
  });
  if (loops.length === 0) return { resolved: 0, expired: 0 };

  const tasks = await prisma.task.findMany({
    where: { id: { in: loops.map((l) => l.followUpTaskId as string) } },
    select: { id: true, status: true, schedulerStatus: true },
  });
  const byId = new Map(tasks.map((t) => [t.id, t]));

  const resolveIds: string[] = [];
  const expireIds: string[] = [];
  for (const l of loops) {
    const t = byId.get(l.followUpTaskId as string);
    if (!t) { expireIds.push(l.id); continue; }
    if (t.status === "done") resolveIds.push(l.id);
    else if (t.status === "cancelled") expireIds.push(l.id);
    else if (ACTIVE.includes(t.status) && ["exhausted", "stale"].includes(t.schedulerStatus)) expireIds.push(l.id);
  }
  const now = new Date();
  if (resolveIds.length) await prisma.openLoop.updateMany({ where: { id: { in: resolveIds } }, data: { status: "resolved", resolvedAt: now } });
  if (expireIds.length) await prisma.openLoop.updateMany({ where: { id: { in: expireIds } }, data: { status: "expired" } });
  return { resolved: resolveIds.length, expired: expireIds.length };
}

async function expireAncient(now: Date): Promise<number> {
  const r = await prisma.openLoop.updateMany({
    where: { status: "open", dueAt: { not: null, lt: new Date(+now - LOOP_EXPIRE_MS) } },
    data: { status: "expired" },
  });
  return r.count;
}

/**
 * Escalate overdue awaiting_owner loops (queries) via push notification.
 */
async function escalateOverdueQueries(now: Date): Promise<number> {
  const overdue = await prisma.openLoop.findMany({
    where: {
      status: "open",
      kind: "awaiting_owner",
      dueAt: { not: null, lte: new Date(+now - QUERY_OVERDUE_MS) },
    },
    orderBy: { dueAt: "asc" },
    take: BATCH,
    include: { relationship: { select: { individualId: true } } },
  });

  let escalated = 0;
  for (const loop of overdue) {
    try {
      // Send push notification to owner
      await sendPush(loop.relationship.individualId, {
        type: "query_overdue",
        loopId: loop.id,
        text: loop.text,
        dueAt: loop.dueAt,
      }).catch((err) => logger.error({ err, loopId: loop.id }, "loopSweeper: failed to send push notification"));

      // Update lastActionAt to avoid repeated notifications
      await prisma.openLoop.update({
        where: { id: loop.id },
        data: { lastActionAt: now },
      });
      escalated++;
    } catch (err) {
      logger.error({ err, loopId: loop.id }, "loopSweeper: failed to escalate query");
    }
  }
  return escalated;
}

/**
 * Mark scheduled tasks without dueDate as stale (unparseable date).
 */
async function staleTasksWithoutDueDate(now: Date): Promise<number> {
  const stale = await prisma.task.findMany({
    where: {
      status: { in: ["open", "suggested"] },
      kind: "call",
      dueDate: null,
      schedulerStatus: "pending",
      createdAt: { lt: new Date(+now - QUERY_OVERDUE_MS) },
    },
    select: { id: true },
    take: BATCH,
  });

  if (stale.length === 0) return 0;

  const staleIds = stale.map((t) => t.id);
  await prisma.task.updateMany({
    where: { id: { in: staleIds } },
    data: { schedulerStatus: "stale" },
  });

  logger.info({ count: staleIds.length }, "loopSweeper: marked tasks without dueDate as stale");
  return staleIds.length;
}
