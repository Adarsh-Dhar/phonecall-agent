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
 * whose due date has arrived and haven't been triggered yet, and broadcasts
 * a "call_due" notification over the /notifications WebSocket (see
 * services/notifications.ts) to any browser tab that's currently open and
 * connected. The frontend (hooks/useCallDueNotifications.ts) reacts to that
 * by auto-opening the same mic-based call widget used everywhere else — so
 * a human sitting at that browser can pick it up immediately and talk,
 * without having to notice the due time and click "Call" themselves.
 *
 * If no browser tab is open and connected at the moment a task comes due,
 * nothing happens right then — there's no push-to-a-closed-tab mechanism.
 * The task is still marked as triggered (see the callTriggeredAt guard
 * below) so it won't fire again once someone does reconnect; it simply
 * stays due, visible in the UI, until someone manually calls about it.
 */

import { prisma } from "@workspace/db-prisma";
import { logger } from "../lib/logger";
import { broadcastCallDue } from "./notifications";

const POLL_INTERVAL_MS = Number(process.env.CALL_SCHEDULER_POLL_MS) || 30_000;

let pollTimer: ReturnType<typeof setInterval> | null = null;

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
  try {
    const now = new Date();

    const dueTasks = await prisma.task.findMany({
      where: {
        dueDate: { lte: now },
        callTriggeredAt: null,
        status: { in: ["open", "in_progress"] },
      },
      include: { 
        contact: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    for (const task of dueTasks) {
      // Claim it before broadcasting — if the poll interval is short or a
      // broadcast is slow, this stops the same due task from firing twice.
      await prisma.task.update({
        where: { id: task.id },
        data: { callTriggeredAt: now },
      });

      const delivered = broadcastCallDue({
        type: "call_due",
        taskId: task.id,
        contactId: task.contactId,
        contactName: task.contact.name,
        title: task.title,
        description: task.description,
        ownerId: task.contact.ownerId!,
      });

      logger.info(
        { taskId: task.id, contactName: task.contact.name, delivered },
        delivered > 0
          ? "callScheduler: task due — notified a connected tab to start the call"
          : "callScheduler: task due but no browser tab is connected to pick it up"
      );
    }
  } catch (err) {
    logger.error({ err }, "callScheduler: failed to check due tasks");
  }
}
