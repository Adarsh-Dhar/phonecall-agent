/**
 * Call Scheduler — the background "agent" that has calendar access (via
 * Task.dueDate, which is kept in sync with Google Calendar by
 * services/calendarSync.ts) and decides when it's time to call a contact.
 *
 * IMPORTANT — what this actually does and does not do:
 *
 * There is still no telephony carrier wired into this app (see the note at
 * the top of services/voiceStreamBrowser.ts) — this scheduler cannot dial a
 * real phone number. What it DOES do: every poll cycle, it looks for tasks
 * whose nextAttemptAt has arrived and haven't been claimed yet, and broadcasts
 * a "call_due" notification over the presence registry (see services/presence.ts)
 * to any browser tab that's currently open and connected. Falls back to push
 * notifications (services/push.ts) if the user is offline. The frontend
 * (hooks/useCallDueNotifications.ts) reacts to that by auto-opening the same
 * mic-based call widget used everywhere else — so a human sitting at that
 * browser can pick it up immediately and talk, without having to notice the
 * due time and click "Call" themselves.
 *
 * If AUTODIAL_ENABLED is set and a telephony provider is configured, the
 * scheduler will attempt to place a real phone call instead of just notifying.
 * See services/telephony.ts for the telephony provider interface.
 *
 * "Triggered" means the scheduler has attempted to notify the user about the
 * task. A task is re-triggered (with exponential backoff) if the user ignores
 * the notification or is offline, up to MAX_ATTEMPTS.
 */

import { prisma } from "@workspace/db-prisma";
import { logger } from "../lib/logger";
import { broadcastCallDue } from "./notifications";
import { computeNextAttempt, isWithinAllowedWindow, MAX_ATTEMPTS } from "./schedulerPolicy";
import { placeCall, isAutoDialEnabled } from "./telephony";

const POLL_INTERVAL_MS = Number(process.env.CALL_SCHEDULER_POLL_MS) || 30_000;
const STALE_WINDOW_MS = (Number(process.env.SCHEDULER_STALE_HOURS) || 24) * 60 * 60 * 1000;
const CLAIM_TTL_MS = Number(process.env.SCHEDULER_CLAIM_TTL_MS) || 5 * 60 * 1000;
const CONCURRENCY_LIMIT = 5;

let pollTimer: ReturnType<typeof setInterval> | null = null;
let isRunning = false;

export function startCallScheduler(): void {
  if (pollTimer) {
    logger.warn("Call scheduler already started");
    return;
  }

  logger.info({ pollIntervalMs: POLL_INTERVAL_MS }, "Starting call scheduler");

  void checkDueTasks();
  pollTimer = setInterval(() => void checkDueTasks(), POLL_INTERVAL_MS);
}

export function stopCallScheduler(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
    logger.info("Stopped call scheduler");
  }
}

async function checkDueTasks(): Promise<void> {
  if (isRunning) {
    logger.debug("callScheduler: previous cycle still running, skipping");
    return;
  }

  isRunning = true;
  try {
    const now = new Date();
    const staleThreshold = new Date(now.getTime() - STALE_WINDOW_MS);

    // Mark stale tasks (older than STALE_WINDOW) as 'stale' so they don't fire
    const staleResult = await prisma.task.updateMany({
      where: {
        kind: "call",
        status: { in: ["open", "in_progress"] },
        schedulerStatus: "pending",
        nextAttemptAt: { lt: staleThreshold },
      },
      data: { schedulerStatus: "stale" },
    });

    if (staleResult.count > 0) {
      logger.info({ count: staleResult.count }, "callScheduler: marked stale tasks");
    }

    // Recover stuck claims (claimed for longer than CLAIM_TTL_MS)
    const claimStaleThreshold = new Date(now.getTime() - CLAIM_TTL_MS);
    const recoveredResult = await prisma.task.updateMany({
      where: {
        schedulerStatus: "claimed",
        schedulerClaimedAt: { lt: claimStaleThreshold },
      },
      data: {
        schedulerStatus: "pending",
        schedulerClaimedAt: null,
      },
    });

    if (recoveredResult.count > 0) {
      logger.info({ count: recoveredResult.count }, "callScheduler: recovered stuck claims");
    }

    // Atomic claim: update tasks from pending to claimed in one transaction
    const claimed = await prisma.task.updateMany({
      where: {
        kind: "call",
        status: { in: ["open", "in_progress"] },
        schedulerStatus: "pending",
        nextAttemptAt: { lte: now },
      },
      data: {
        schedulerStatus: "claimed",
        schedulerClaimedAt: now,
      },
    });

    if (claimed.count === 0) {
      return;
    }

    logger.info({ count: claimed.count }, "callScheduler: claimed tasks for processing");

    // Fetch the claimed tasks
    const tasks = await prisma.task.findMany({
      where: {
        kind: "call",
        status: { in: ["open", "in_progress"] },
        schedulerStatus: "claimed",
        schedulerClaimedAt: now,
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            ownerId: true,
            timezone: true,
            quietHoursStart: true,
            quietHoursEnd: true,
            businessHoursJson: true,
          },
        },
      },
    });

    // Process tasks with concurrency limit
    const chunks: typeof tasks[] = [];
    for (let i = 0; i < tasks.length; i += CONCURRENCY_LIMIT) {
      chunks.push(tasks.slice(i, i + CONCURRENCY_LIMIT));
    }

    for (const chunk of chunks) {
      await Promise.all(chunk.map((task) => processTask(task, now)));
    }
  } catch (err) {
    logger.error({ err }, "callScheduler: failed to check due tasks");
  } finally {
    isRunning = false;
  }
}

async function processTask(task: any, now: Date): Promise<void> {
  try {
    const { contact } = task;

    // Skip contacts with no owner - mark as exhausted
    if (!contact.ownerId) {
      await prisma.task.update({
        where: { id: task.id },
        data: { schedulerStatus: "exhausted" },
      });
      logger.warn(
        { taskId: task.id, contactId: contact.id },
        "callScheduler: task has no owner, marking as exhausted"
      );
      return;
    }

    // Check if within allowed window (quiet hours, business hours)
    const ownerTz = contact.timezone || process.env.DEFAULT_TIMEZONE || "UTC";
    const businessHours = contact.businessHoursJson ? JSON.parse(contact.businessHoursJson) : null;
    const windowCheck = isWithinAllowedWindow(
      now,
      ownerTz,
      contact.quietHoursStart,
      contact.quietHoursEnd,
      businessHours
    );

    if (!windowCheck.allowed) {
      // Not allowed now - defer to next allowed time without consuming an attempt
      await prisma.task.update({
        where: { id: task.id },
        data: {
          schedulerStatus: "pending",
          nextAttemptAt: windowCheck.nextAllowedTime,
        },
      });
      logger.info(
        { taskId: task.id, nextAttemptAt: windowCheck.nextAllowedTime },
        "callScheduler: task outside allowed window, deferring"
      );
      return;
    }

    // Try auto-dial if enabled and contact has a phone number
    let autoDialed = false;
    if (isAutoDialEnabled() && contact.phone) {
      // Create a call record for the auto-dial
      const call = await prisma.call.create({
        data: {
          status: "initiated",
          direction: "outbound",
          from: process.env.EXOTEL_CALLER_ID || "unknown",
          to: contact.phone,
          calleeAccountId: contact.id,
          taskId: task.id,
          conversationId: task.conversationId,
          contactId: task.contactId,
        },
      });

      const dialResult = await placeCall({
        to: contact.phone,
        from: process.env.EXOTEL_CALLER_ID || "unknown",
        taskId: task.id,
        callId: call.id,
      });

      if (dialResult.success) {
        autoDialed = true;
        logger.info(
          { taskId: task.id, callId: call.id, providerCallId: dialResult.providerCallId },
          "callScheduler: auto-dial placed successfully"
        );
      } else {
        // Auto-dial failed, fall back to notification
        logger.warn(
          { taskId: task.id, error: dialResult.error },
          "callScheduler: auto-dial failed, falling back to notification"
        );
        // Clean up the failed call record
        await prisma.call.delete({ where: { id: call.id } });
      }
    }

    // Attempt to notify the user (if auto-dial didn't succeed or wasn't attempted)
    let delivered = false;
    if (!autoDialed) {
      delivered = await broadcastCallDue({
        type: "call_due",
        taskId: task.id,
        contactId: task.contactId,
        contactName: contact.name,
        title: task.title,
        description: task.description,
        ownerId: contact.ownerId,
        attempt: task.callAttempts + 1,
        maxAttempts: MAX_ATTEMPTS,
      });
    } else {
      // Auto-dial succeeded, count as delivered
      delivered = true;
    }

    // Increment attempt count and set lastAttemptAt
    const newAttempts = task.callAttempts + 1;
    const nextAttemptTime = computeNextAttempt(newAttempts, now);

    if (newAttempts >= MAX_ATTEMPTS) {
      // Exhausted attempts - mark as exhausted
      await prisma.task.update({
        where: { id: task.id },
        data: {
          callAttempts: newAttempts,
          lastAttemptAt: now,
          schedulerStatus: "exhausted",
        },
      });
      logger.info(
        { taskId: task.id, attempts: newAttempts },
        "callScheduler: task exhausted after max attempts"
      );
    } else if (delivered) {
      // Successfully delivered - set next attempt time and release claim
      await prisma.task.update({
        where: { id: task.id },
        data: {
          callAttempts: newAttempts,
          lastAttemptAt: now,
          schedulerStatus: "pending",
          nextAttemptAt: nextAttemptTime,
        },
      });
      logger.info(
        { taskId: task.id, attempt: newAttempts, nextAttemptAt: nextAttemptTime },
        "callScheduler: task notified, scheduled next attempt"
      );
    } else {
      // Delivery failed (user offline) - apply backoff and retry
      await prisma.task.update({
        where: { id: task.id },
        data: {
          callAttempts: newAttempts,
          lastAttemptAt: now,
          schedulerStatus: "pending",
          nextAttemptAt: nextAttemptTime,
        },
      });
      logger.info(
        { taskId: task.id, attempt: newAttempts, nextAttemptAt: nextAttemptTime },
        "callScheduler: task delivery failed, will retry with backoff"
      );
    }
  } catch (err) {
    // Release claim on error so it can be retried
    await prisma.task.update({
      where: { id: task.id },
      data: {
        schedulerStatus: "pending",
        schedulerClaimedAt: null,
      },
    }).catch((updateErr) => {
      logger.error({ err: updateErr, taskId: task.id }, "callScheduler: failed to release claim");
    });
    logger.error({ err, taskId: task.id }, "callScheduler: failed to process task");
  }
}
