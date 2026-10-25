/**
 * Call Scheduler — the background "agent" that has calendar access (via
 * Task.dueDate, which is kept in sync with Google Calendar by
 * services/calendarSync.ts) and decides when it's time to call a contact.
 *
 * DESIGN DECISION: calls are in-app only. This scheduler never dials a phone
 * number. When a task's nextAttemptAt arrives:
 *   1. If the owner turned on AGENT MODE (Account.agentMode) and the task's contact is linked
 *      to a real business account (that is what dialCallAs needs), the AGENT places the
 *      call itself (services/agentCallTools.ts → dialCallAs): the business's app
 *      rings, and once they accept, the individual's AI agent talks to them.
 *      CALL_SCHEDULER_AUTO_DIAL=0 is a global kill switch: nobody's agent dials, owners are only notified.
 *   2. Otherwise (agent mode off, no linked business account, or the call can't be created) it
 *      broadcasts "call_due" to the owner's open browser tabs (services/presence.ts),
 *      falling back to push (services/push.ts) when they are offline.
 * Do not reintroduce a carrier dial path here: it would create Call rows with no
 * individualId/businessId, which every ownership check in services/callSignaling.ts
 * relies on.
 *
 * EXACT TIMING: the 30s poll alone could fire up to 30s late. startCallScheduler() also
 * arms a one-shot timer for the earliest upcoming nextAttemptAt (armWake), re-armed after
 * every cycle and whenever a task is created/moved (nudgeScheduler), so calls fire at the
 * scheduled instant (±~10ms) while the poll remains the safety net.
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
import { broadcastCallDue, broadcastCallExhausted, broadcastTaskDue } from "./notifications";
import { sendToAccount } from "./presence";
import { computeNextAttempt, computeAutoDialRetry, isWithinAllowedWindow, parseBusinessHours, MAX_ATTEMPTS, resolveEffectiveHours, DEFAULT_BUSINESS_HOURS } from "./schedulerPolicy";
import { agentPlaceCall } from "./agentCallTools";
import { RINGING_TIMEOUT_MS } from "./callSignaling";
import type { Closure } from "./closurePolicy";
import { AGENT_KINDS, normalizeKind, nextFireAfter } from "./taskKinds";
import { sweepOverdueLoops } from "./memory/loopSweeper";
import { notifyOwnerFallback, messageBusinessFallback } from "./outbound";
import { runDigestCycle } from "./ownerDigest";

const POLL_INTERVAL_MS = Number(process.env.CALL_SCHEDULER_POLL_MS) || 30_000;
const STALE_WINDOW_MS = (Number(process.env.SCHEDULER_STALE_HOURS) || 24) * 60 * 60 * 1000;
const CLAIM_TTL_MS = Number(process.env.SCHEDULER_CLAIM_TTL_MS) || 5 * 60 * 1000;
const CONCURRENCY_LIMIT = 5;

/** The agent dials by itself when the task's contact is a linked business. 0 = notify only. */
const AUTO_DIAL = process.env.CALL_SCHEDULER_AUTO_DIAL !== "0";
/** Calendar-created call tasks ignore quiet hours / business hours unless this is "1" (closures still apply). */
const CALENDAR_CALLS_RESPECT_HOURS = process.env.CALENDAR_CALLS_RESPECT_HOURS === "1";

const WAKE_PAD_MS = 5; // timers can fire a hair early relative to Date.now()

let pollTimer: ReturnType<typeof setInterval> | null = null;
let wakeTimer: ReturnType<typeof setTimeout> | null = null;
let isRunning = false;
let started = false;
let rerunRequested = false;

export function startCallScheduler(): void {
  if (pollTimer) {
    logger.warn("Call scheduler already started");
    return;
  }

  logger.info({ pollIntervalMs: POLL_INTERVAL_MS }, "Starting call scheduler");

  started = true;
  void checkDueTasks();
  pollTimer = setInterval(() => void checkDueTasks(), POLL_INTERVAL_MS);
}

export function stopCallScheduler(): void {
  started = false;
  if (wakeTimer) {
    clearTimeout(wakeTimer);
    wakeTimer = null;
  }
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
    logger.info("Stopped call scheduler");
  }
}

/**
 * Re-arm the exact-time wake-up. Call after creating or moving a call task so it fires at its
 * scheduled instant instead of waiting for the next poll. No-op until startCallScheduler() ran.
 */
export function nudgeScheduler(): void {
  if (started) void armWake();
}

/** One-shot timer for the earliest future pending task that falls inside the next poll window. */
async function armWake(): Promise<void> {
  try {
    if (wakeTimer) {
      clearTimeout(wakeTimer);
      wakeTimer = null;
    }
    const now = new Date();
    const next = await prisma.task.findFirst({
      where: {
        status: { in: ["open", "in_progress"] },
        schedulerStatus: "pending",
        nextAttemptAt: { gt: now },
      },
      orderBy: { nextAttemptAt: "asc" },
      select: { nextAttemptAt: true },
    });
    if (!next?.nextAttemptAt) return;

    const delay = next.nextAttemptAt.getTime() - Date.now();
    // Further away than one poll interval: the regular poll re-arms on its next cycle.
    if (delay > POLL_INTERVAL_MS) return;

    wakeTimer = setTimeout(() => {
      wakeTimer = null;
      void checkDueTasks();
    }, Math.max(delay, 0) + WAKE_PAD_MS);
    wakeTimer.unref?.();
  } catch (err) {
    logger.error({ err }, "callScheduler: failed to arm wake-up timer");
  }
}

/**
 * Everything that follows "the agent could not get through and will not try again": tell the owner
 * (tabs, push, then the email fallback) and, when the agent itself was the caller and the owner opted
 * this contact in, message the business too. Never throws (both senders swallow their own errors).
 */
async function announceUnreached(p: {
  taskId: string;
  contactId: string;
  contactName: string;
  title: string;
  ownerId: string;
  attempts: number;
  /** True only when the agent was the caller. If the owner was the one asked to call, the business is not contacted. */
  messageBusiness: boolean;
}): Promise<void> {
  const reached = await broadcastCallExhausted({
    type: "call_exhausted",
    taskId: p.taskId,
    contactId: p.contactId,
    contactName: p.contactName,
    title: p.title,
    attempts: p.attempts,
    ownerId: p.ownerId,
  });
  // No open tab and no push subscription: fall back to email.
  if (!reached) {
    await notifyOwnerFallback(p.ownerId, {
      subject: `Couldn't reach ${p.contactName}`,
      text: `Your agent tried ${p.attempts} times to reach ${p.contactName} about "${p.title}" and couldn't get through (they may be offline or unavailable).`,
      url: `/tasks/${p.taskId}`,
      taskId: p.taskId,
    });
  }
  if (p.messageBusiness) {
    await messageBusinessFallback({
      ownerId: p.ownerId,
      contactId: p.contactId,
      taskId: p.taskId,
      taskTitle: p.title,
      attempts: p.attempts,
    });
  }
}

/**
 * The final attempt rang but nobody picked up, so the ring timed out and the call just became
 * "missed". Only now do we know the task really is unreachable, so announce it (once: a call
 * leaves "ringing" exactly once).
 */
async function handleFinalMissedAgentCall(callId: string, taskId: string): Promise<void> {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        title: true,
        contactId: true,
        callAttempts: true,
        schedulerStatus: true,
        contact: { select: { ownerId: true, name: true } },
      },
    });
    if (!task || !task.contact.ownerId) return;
    if (task.schedulerStatus !== "exhausted" || task.callAttempts < MAX_ATTEMPTS) return;
    // Only the task's most recent call counts; an older ring timing out is not the end of the story.
    const latest = await prisma.call.findFirst({ where: { taskId }, orderBy: { createdAt: "desc" }, select: { id: true } });
    if (latest?.id !== callId) return;
    await announceUnreached({
      taskId: task.id,
      contactId: task.contactId,
      contactName: task.contact.name ?? "the contact",
      title: task.title,
      ownerId: task.contact.ownerId,
      attempts: task.callAttempts,
      messageBusiness: true,
    });
  } catch (err) {
    logger.error({ err, callId, taskId }, "callScheduler: failed to announce final missed call");
  }
}

export async function checkDueTasks(): Promise<void> {
  if (isRunning) {
    logger.debug("callScheduler: previous cycle still running, skipping");
    // A due task must not wait for the next poll just because a cycle was mid-flight.
    if (started) rerunRequested = true;
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
        taskId: true,
        placedByAgent: true,
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
            type: 'call_status',
            callId: call.id,
            status: 'missed',
          });
        }
        if (call.businessId) {
          sendToAccount(call.businessId, {
            type: 'call_status',
            callId: call.id,
            status: 'missed',
          });
        }
      }
      // The agent's last allowed attempt rang out unanswered: now the owner (and an opted-in
      // business) can be told the contact could not be reached.
      for (const call of staleRingingCalls) {
        if (call.taskId && call.placedByAgent) await handleFinalMissedAgentCall(call.id, call.taskId);
      }
    }

    // Mark stale tasks (older than STALE_WINDOW) as 'stale' so they don't fire
    const staleResult = await prisma.task.updateMany({
      where: {
        kind: { in: AGENT_KINDS },
        status: { in: ["open", "in_progress"] },
        schedulerStatus: "pending",
        nextAttemptAt: { lt: staleThreshold },
      },
      data: { schedulerStatus: "stale" },
    });

    if (staleResult.count > 0) {
      logger.info({ count: staleResult.count }, "callScheduler: marked stale tasks");
    }

    // Overdue promises -> check-in call tasks. Runs before the due-task query below so a new
    // check-in can fire in this same cycle. Never throws.
    await sweepOverdueLoops(now);

    // Owner digest (agent mode). Throttled and claim-guarded inside; fire and forget so a slow
    // email provider never delays dialing.
    void runDigestCycle(now);

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

    // Atomic claim: update agent tasks from pending to claimed in one transaction
    const claimed = await prisma.task.updateMany({
      where: {
        kind: { in: AGENT_KINDS },
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

    logger.info({ count: claimed.count }, "callScheduler: claimed agent tasks for processing");

    // Fetch the claimed agent tasks with owner account
    const tasks = await prisma.task.findMany({
      where: {
        kind: { in: AGENT_KINDS },
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

    // Second claim for owner kinds (bring, pay, submit, reminder)
    const ownerClaimed = await prisma.task.updateMany({
      where: {
        kind: { notIn: AGENT_KINDS },
        status: "open",
        schedulerStatus: "pending",
        nextAttemptAt: { lte: now },
      },
      data: {
        schedulerStatus: "claimed",
        schedulerClaimedAt: now,
      },
    });

    if (ownerClaimed.count > 0) {
      logger.info({ count: ownerClaimed.count }, "callScheduler: claimed owner tasks for processing");

      const ownerTasks = await prisma.task.findMany({
        where: {
          kind: { notIn: AGENT_KINDS },
          status: "open",
          schedulerStatus: "claimed",
          schedulerClaimedAt: now,
        },
        include: {
          contact: {
            select: {
              id: true,
              ownerId: true,
            },
          },
        },
      });

      for (const task of ownerTasks) {
        await processOwnerTask(task, now).catch((err) => {
          logger.error({ err, taskId: task.id }, "callScheduler: failed to process owner task");
        });
      }
    }
  } catch (err) {
    logger.error({ err }, "callScheduler: failed to check due tasks");
  } finally {
    isRunning = false;
    if (started) {
      if (rerunRequested) {
        rerunRequested = false;
        void checkDueTasks();
      } else {
        void armWake();
      }
    }
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
        agentMode: true,
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

    // A call the user put on their calendar for a specific time runs at that time, even outside the
    // contact's usual opening hours or the owner's quiet hours (they chose it explicitly). Closures
    // the business declared (holiday / out of service) still block it.
    const ignoreHours = task.source === "calendar" && !CALENDAR_CALLS_RESPECT_HOURS;
    const windowCheck = isWithinAllowedWindow(
      now,
      ownerTz,
      ignoreHours ? null : owner.quietHoursStart,
      ignoreHours ? null : owner.quietHoursEnd,
      ignoreHours ? null : businessHours || null,
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

    // Preferred path: the agent places the call itself. It only applies when the owner is an
    // individual who turned agent mode ON and the contact is linked to a real business account
    // (that is what dialCallAs needs). With agent mode off the owner is notified instead.
    let autoDialed = false;
    let delivered = false;
    if (AUTO_DIAL && owner.agentMode && !owner.isService && contact.linkedAccountId && biz) {
      const outcome = await agentPlaceCall({
        ownerId: contact.ownerId,
        contactId: contact.id,
        contactName: contact.name,
        taskId: task.id,
        taskTitle: task.title,
      });
      if (outcome.kind === "ringing") {
        autoDialed = true;
        delivered = true;
      } else if (outcome.kind === "missed") {
        autoDialed = true; // business offline; a missed Call row exists, retry soon
      } else {
        logger.info(
          { taskId: task.id, reason: outcome.reason },
          "callScheduler: agent could not place call, falling back to notification",
        );
      }
    }

    // Fallback path (also the only path when auto-dial is off / contact isn't dialable): notify the user.
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
    }

    // Increment attempt count and set lastAttemptAt
    const newAttempts = task.callAttempts + 1;
    const nextAttemptTime = autoDialed
      ? computeAutoDialRetry(newAttempts, now)
      : computeNextAttempt(newAttempts, now);

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

      // If the final attempt just started ringing, don't tell the user "couldn't reach" yet — the
      // Call row shows how it ended.
      if (!(autoDialed && delivered)) {
        await announceUnreached({
          taskId: task.id,
          contactId: task.contactId,
          contactName: contact.name,
          title: task.title,
          ownerId: contact.ownerId,
          attempts: newAttempts,
          // autoDialed here means the agent dialled and the business was offline (a "missed" call).
          // If the owner was merely notified to call, the owner is responsible and the business is left alone.
          messageBusiness: autoDialed,
        });
      }

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

async function processOwnerTask(task: any, now: Date): Promise<void> {
  const owner = await prisma.account.findUnique({
    where: { id: task.contact.ownerId },
    select: { timezone: true, quietHoursStart: true, quietHoursEnd: true },
  });
  if (!owner || !task.dueDate) {
    await prisma.task.update({
      where: { id: task.id },
      data: { schedulerStatus: "pending", schedulerClaimedAt: null },
    });
    return;
  }

  const tz = owner.timezone || process.env.DEFAULT_TIMEZONE || "UTC";

  // Quiet hours only. Business hours and closures do not apply to owner kinds.
  if (!isWithinAllowedWindow(now, tz, null, owner.quietHoursStart, owner.quietHoursEnd).allowed) {
    const next = computeNextAttempt(task.callAttempts + 1, now);
    // Defer without consuming the reminder: lastAttemptAt and callAttempts stay untouched.
    await prisma.task.update({
      where: { id: task.id },
      data: { nextAttemptAt: next, schedulerClaimedAt: null },
    });
    return;
  }

  const reached = await broadcastTaskDue({ ...task, contact: { ownerId: task.contact.ownerId } });
  if (!reached) {
    await notifyOwnerFallback(task.contact.ownerId, {
      subject: `Reminder: ${task.title}`.slice(0, 120),
      text: task.dueDate ? `${task.title}\nDue: ${task.dueDate.toISOString()}` : task.title,
      url: `/tasks/${task.id}`,
      taskId: task.id,
    });
  }
  const kind = normalizeKind(task.kind);
  const next = nextFireAfter(kind, task.dueDate, tz, now);
  await prisma.task.update({
    where: { id: task.id },
    data: {
      callAttempts: { increment: 1 },
      lastAttemptAt: now,
      schedulerClaimedAt: null,
      nextAttemptAt: next,
      schedulerStatus: next ? "pending" : "done",
    },
  });
  // Never emit call_exhausted for owner kinds.
}


