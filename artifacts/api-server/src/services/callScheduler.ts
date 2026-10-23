/**
 * Call Scheduler — the background "agent" that has calendar access (via
 * Task.dueDate, which is kept in sync with Google Calendar by
 * services/calendarSync.ts) and decides when it's time to call a contact.
 *
 * DESIGN DECISION: calls are in-app only. This scheduler never dials a phone
 * number. When a task's nextAttemptAt arrives it broadcasts "call_due" to the
 * owner's open browser tabs (services/presence.ts), falling back to push
 * (services/push.ts) when they are offline. The frontend then opens the
 * browser-mic call widget. Do not reintroduce a carrier dial path here: it
 * would create Call rows with no individualId/businessId, which every
 * ownership check in services/callSignaling.ts relies on.
 *
 * When a task exhausts its maximum retry attempts (MAX_ATTEMPTS), the scheduler
 * broadcasts a "call_exhausted" notification to inform the user that the contact
 * could not be reached after multiple attempts.
 *
 * "Triggered" means the scheduler has attempted to notify the user about the
 * task. A task is re-triggered (with exponential backoff) if the user ignores
 * the notification or is offline, up to MAX_ATTEMPTS.
 */

import { prisma } from "@workspace/db-prisma";
import { logger } from "../lib/logger";
import { broadcastCallDue, broadcastCallExhausted } from "./notifications";
import { sendToAccount } from "./presence";
import { computeNextAttempt, isWithinAllowedWindow, parseBusinessHours, MAX_ATTEMPTS, resolveEffectiveHours, DEFAULT_BUSINESS_HOURS } from "./schedulerPolicy";
import type { Closure } from "./closurePolicy";

const POLL_INTERVAL_MS = Number(process.env.CALL_SCHEDULER_POLL_MS) || 30_000;
const STALE_WINDOW_MS = (Number(process.env.SCHEDULER_STALE_HOURS) || 24) * 60 * 60 * 1000;
const CLAIM_TTL_MS = Number(process.env.SCHEDULER_CLAIM_TTL_MS) || 5 * 60 * 1000;
const CONCURRENCY_LIMIT = 5;
const RINGING_TIMEOUT_MS = Number(process.env.RINGING_TIMEOUT_MS) || 60 * 1000; // 1 minute

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

export async function checkDueTasks(): Promise<void> {
  if (isRunning) {
    logger.debug("callScheduler: previous cycle still running, skipping");
    return;
  }

  isRunning = true;
  try {
    const now = new Date();
    const staleThreshold = new Date(now.getTime() - STALE_WINDOW_MS);
    const ringingTimeoutThreshold = new Date(now.getTime() - RINGING_TIMEOUT_MS);

    // Mark stale ringing calls as missed (calls that have been ringing too long)
    const staleRingingCalls = await prisma.call.findMany({
      where: {
        status: 'ringing',
        ringingAt: { lt: ringingTimeoutThreshold },
      },
      select: {
        id: true,
        individualId: true,
        businessId: true,
      },
    });

    if (staleRingingCalls.length > 0) {
      await prisma.call.updateMany({
        where: {
          id: { in: staleRingingCalls.map(c => c.id) },
        },
        data: { status: 'missed' },
      });

      logger.info({ count: staleRingingCalls.length }, "callScheduler: marked stale ringing calls as missed");

      // Notify both parties about the status change
      for (const call of staleRingingCalls) {
        if (call.individualId) {
          sendToAccount(call.individualId, {
            type: 'call_status_changed',
            callId: call.id,
            status: 'missed',
          });
        }
        if (call.businessId) {
          sendToAccount(call.businessId, {
            type: 'call_status_changed',
            callId: call.id,
            status: 'missed',
          });
        }
      }
    }

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

    // Fetch the claimed tasks with owner account
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
            businessHoursJson: true,
            timezone: true,
            linkedAccountId: true,
          },
        },
      },
    });

    // Load linked business accounts once for the whole batch
    const linkedIds = [...new Set(tasks.map(t => t.contact.linkedAccountId).filter(Boolean))] as string[];
    const linked = await prisma.account.findMany({
      where: { id: { in: linkedIds } },
      select: { id: true, businessHoursJson: true, timezone: true },
    });
    const linkedMap = new Map(linked.map(a => [a.id, a]));

    // Load current and upcoming closures for those businesses in one query
    const closureRows = linkedIds.length
      ? await prisma.businessClosure.findMany({
          where: { businessId: { in: linkedIds }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
          select: { businessId: true, startsAt: true, endsAt: true },
        })
      : [];
    const closuresByBusiness = new Map<string, Closure[]>();
    for (const row of closureRows) {
      const list = closuresByBusiness.get(row.businessId) ?? [];
      list.push({ startsAt: row.startsAt, endsAt: row.endsAt });
      closuresByBusiness.set(row.businessId, list);
    }

    // Also load closures for the business owners (who are making outbound calls)
    const ownerIds = [...new Set(tasks.map(t => t.contact.ownerId).filter(Boolean))] as string[];
    const ownerClosureRows = ownerIds.length
      ? await prisma.businessClosure.findMany({
          where: { businessId: { in: ownerIds }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
          select: { businessId: true, startsAt: true, endsAt: true },
        })
      : [];
    const closuresByOwner = new Map<string, Closure[]>();
    for (const row of ownerClosureRows) {
      const list = closuresByOwner.get(row.businessId) ?? [];
      list.push({ startsAt: row.startsAt, endsAt: row.endsAt });
      closuresByOwner.set(row.businessId, list);
    }

    // Process tasks with concurrency limit
    const chunks: typeof tasks[] = [];
    for (let i = 0; i < tasks.length; i += CONCURRENCY_LIMIT) {
      chunks.push(tasks.slice(i, i + CONCURRENCY_LIMIT));
    }

    for (const chunk of chunks) {
      await Promise.all(chunk.map((task) => processTask(task, now, linkedMap, closuresByBusiness, closuresByOwner)));
    }
  } catch (err) {
    logger.error({ err }, "callScheduler: failed to check due tasks");
  } finally {
    isRunning = false;
  }
}

async function processTask(
  task: any,
  now: Date,
  linkedMap: Map<string, any>,
  closuresByBusiness: Map<string, Closure[]> = new Map(),
  closuresByOwner: Map<string, Closure[]> = new Map(),
): Promise<void> {
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

    // Load owner account for timezone, quiet hours, and business hours
    const owner = await prisma.account.findUnique({
      where: { id: contact.ownerId },
      select: {
        timezone: true,
        quietHoursStart: true,
        quietHoursEnd: true,
        businessHoursJson: true,
        isService: true,
      },
    });

    if (!owner) {
      await prisma.task.update({
        where: { id: task.id },
        data: { schedulerStatus: "exhausted" },
      });
      logger.warn(
        { taskId: task.id, ownerId: contact.ownerId },
        "callScheduler: owner account not found, marking as exhausted"
      );
      return;
    }

    // Check if within allowed window (quiet hours, business hours)
    const ownerTz = owner.timezone || process.env.DEFAULT_TIMEZONE || "UTC";
    const biz = contact.linkedAccountId ? linkedMap.get(contact.linkedAccountId) : undefined;

    // If the owner is a business (isService: true, meaning it's a login account that can own service accounts), use their business hours for outbound calls
    // Otherwise, use the contact's business hours (individual calling business)
    let businessHours;
    if (owner.isService) {
      // Business making outbound calls - use business's own hours
      businessHours = owner.businessHoursJson
        ? JSON.parse(owner.businessHoursJson)
        : DEFAULT_BUSINESS_HOURS;
    } else {
      // Individual making outbound calls - use contact's business hours
      const { hours: resolvedHours } = resolveEffectiveHours({
        contactJson: contact.businessHoursJson,
        businessJson: biz?.businessHoursJson,
        businessTz: biz?.timezone,
        contactTz: contact.timezone,
        ownerTz,
      });
      businessHours = resolvedHours;
    }

    // Load closures for the business being called (if applicable)
    let closures;
    if (owner.isService) {
      // Business making outbound calls - check business's own closures
      closures = closuresByOwner.get(contact.ownerId) ?? [];
    } else {
      // Individual making outbound calls - check called business's closures
      closures = biz && closuresByBusiness.has(biz.id)
        ? closuresByBusiness.get(biz.id) ?? []
        : [];
    }

    const windowCheck = isWithinAllowedWindow(
      now,
      ownerTz,
      owner.quietHoursStart,
      owner.quietHoursEnd,
      businessHours || null,
      closures,
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
        "callScheduler: task outside allowed window (hours, quiet hours or closure), deferring"
      );
      return;
    }

    // Check if there's already a call in flight for this task
    const inFlightCall = await prisma.call.findFirst({
      where: {
        taskId: task.id,
        status: { in: ["initiated", "ringing", "in-progress"] },
      },
    });

    if (inFlightCall) {
      // Skip this task - there's already a call in progress
      await prisma.task.update({
        where: { id: task.id },
        data: {
          schedulerStatus: "pending",
          schedulerClaimedAt: null,
        },
      });
      logger.info(
        { taskId: task.id, callId: inFlightCall.id },
        "callScheduler: task has in-flight call, skipping"
      );
      return;
    }

    // Attempt to notify the user
    const delivered = await broadcastCallDue({
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

    // Increment attempt count and set lastAttemptAt
    const newAttempts = task.callAttempts + 1;
    const nextAttemptTime = computeNextAttempt(newAttempts, now);

    if (newAttempts >= MAX_ATTEMPTS) {
      // Exhausted attempts - mark as exhausted and notify owner
      await prisma.task.update({
        where: { id: task.id },
        data: {
          callAttempts: newAttempts,
          lastAttemptAt: now,
          schedulerStatus: "exhausted",
        },
      });

      await broadcastCallExhausted({
        type: "call_exhausted",
        taskId: task.id,
        contactId: task.contactId,
        contactName: contact.name,
        title: task.title,
        attempts: newAttempts,
        ownerId: contact.ownerId,
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
