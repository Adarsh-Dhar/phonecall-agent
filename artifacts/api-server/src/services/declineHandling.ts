/**
 * What happens after a business REJECTS (declines) a call the agent placed.
 *
 * Called from declineCallAs (callSignaling.ts). Before this existed, a rejection was only a
 * websocket event: the scheduler kept re-ringing on its own 2 min / 10 min timer, and a rejected
 * final attempt never told the owner anything.
 *
 *   - A rejection does NOT use up the missed-call attempt budget (MAX_ATTEMPTS): that budget is for
 *     "business offline / didn't pick up". Rejections have their own limit (owner's preference).
 *   - Within the limit: the task is re-armed for now + the owner's chosen delay. The scheduler's
 *     usual checks (business hours, closures, quiet hours) still apply when it fires.
 *   - Over the limit: the task is closed as non-responsive and the owner is notified (tab, push,
 *     then email). The business itself is never messaged about a rejection: it said no.
 *
 * Never throws.
 */
import { prisma } from "@workspace/db-prisma";
import { logger } from "../lib/logger";
import { broadcastCallExhausted } from "./notifications";
import { notifyOwnerFallback } from "./outbound";
import { decideAfterDecline, resolveDeclinePrefs } from "./declinePolicy";
import { isIntroTask } from "./introCall";

export async function handleAgentCallDeclined(callId: string, now = new Date()): Promise<void> {
  try {
    const call = await prisma.call.findUnique({
      where: { id: callId },
      select: { id: true, placedByAgent: true, taskId: true },
    });
    if (!call?.placedByAgent || !call.taskId) return;

    const task = await prisma.task.findUnique({
      where: { id: call.taskId },
      select: {
        id: true,
        title: true,
        status: true,
        meta: true,
        callAttempts: true,
        declineCount: true,
        contactId: true,
        contact: { select: { ownerId: true, name: true } },
      },
    });
    if (!task || !task.contact.ownerId) return;
    if (task.status !== "open" && task.status !== "in_progress") return;
    // Intro calls (agent introducing itself to a new business) keep their own, gentler flow.
    if (isIntroTask(task)) return;

    const ownerId = task.contact.ownerId;
    const owner = await prisma.account.findUnique({
      where: { id: ownerId },
      select: { declineRetryDelayMin: true, declineMaxRetries: true },
    });
    const prefs = resolveDeclinePrefs(owner ?? {});
    const declines = task.declineCount + 1;
    const decision = decideAfterDecline(declines, prefs, now);
    logger.info({ taskId: task.id, callId, declines, maxRetries: prefs.maxRetries, decision: decision.action }, 'declineHandling: evaluating decline decision');

    if (decision.action === "retry") {
      await prisma.task.update({
        where: { id: task.id },
        data: {
          declineCount: declines,
          // Give back the attempt the scheduler counted when it dialed this call.
          callAttempts: Math.max(0, task.callAttempts - 1),
          schedulerStatus: "pending",
          schedulerClaimedAt: null,
          nextAttemptAt: decision.nextAttemptAt,
        },
      });
      logger.info(
        { taskId: task.id, callId, declines, nextAttemptAt: decision.nextAttemptAt },
        "declineHandling: call rejected, recall scheduled",
      );
      return;
    }

    const prevMeta = task.meta && typeof task.meta === "object" && !Array.isArray(task.meta) ? (task.meta as Record<string, unknown>) : {};
    await prisma.task.update({
      where: { id: task.id },
      data: {
        declineCount: declines,
        schedulerStatus: "exhausted",
        schedulerClaimedAt: null,
        nextAttemptAt: null,
        meta: { ...prevMeta, unresponsive: true, unresponsiveReason: "declined", declines },
      },
    });

    const contactName = task.contact.name ?? "The business";
    const reached = await broadcastCallExhausted({
      type: "call_exhausted",
      reason: "declined",
      taskId: task.id,
      contactId: task.contactId,
      contactName,
      title: task.title,
      attempts: declines,
      ownerId,
    });
    if (!reached) {
      await notifyOwnerFallback(ownerId, {
        subject: `${contactName} is not responding`,
        text: `Your agent called ${contactName} about "${task.title}" and ${declines} call${declines === 1 ? " was" : "s were"} rejected. Your agent stopped trying and marked them non-responsive.`,
        url: `/tasks/${task.id}`,
        taskId: task.id,
      });
    }
    logger.info({ taskId: task.id, callId, declines }, "declineHandling: business marked non-responsive");
  } catch (err) {
    logger.error({ err, callId }, "declineHandling: failed to handle declined agent call");
  }
}
