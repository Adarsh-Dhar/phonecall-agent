/**
 * Calendar Sync Service
 *
 * Handles inbound sync from Google Calendar to Tasks using incremental polling.
 * Periodically checks for changes in Google Calendar and updates local tasks.
 */

import { prisma } from "@workspace/db-prisma";
import { listChangedEvents } from "./googleCalendar";
import { logger } from "../lib/logger";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Polling interval in milliseconds (2 minutes) */
const POLL_INTERVAL_MS = 2 * 60 * 1000;

/** Active polling timer */
let pollTimer: ReturnType<typeof setInterval> | null = null;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Start the calendar sync polling service.
 * Should be called on server startup.
 */
export function startCalendarSync(): void {
  if (pollTimer) {
    logger.warn("Calendar sync polling already started");
    return;
  }

  logger.info("Starting calendar sync polling service");

  // Initial sync
  void syncAllUsersCalendarChanges();

  // Set up periodic polling
  pollTimer = setInterval(() => {
    void syncAllUsersCalendarChanges();
  }, POLL_INTERVAL_MS);
}

/**
 * Stop the calendar sync polling service.
 * Should be called on server shutdown.
 */
export function stopCalendarSync(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
    logger.info("Stopped calendar sync polling service");
  }
}

/**
 * Manually trigger a calendar sync for a specific login account.
 * Useful for API endpoints or testing.
 */
export async function manualSync(userId: string): Promise<{
  synced: number;
  errors: number;
}> {
  return await syncCalendarChanges(userId);
}

// ---------------------------------------------------------------------------
// Internal Implementation
// ---------------------------------------------------------------------------

/**
 * Sync calendar changes for all login accounts with refresh tokens.
 */
async function syncAllUsersCalendarChanges(): Promise<void> {
  try {
    // Only login accounts (isService: false) hold OAuth tokens
    const accounts = await prisma.account.findMany({
      where: {
        isService:    false,
        refreshToken: { not: null },
        accessToken:  { not: null },
      },
      select: { id: true },
    });

    for (const account of accounts) {
      try {
        await syncCalendarChanges(account.id);
      } catch (error) {
        logger.error({ error, userId: account.id }, "Failed to sync calendar for account");
      }
    }
  } catch (error) {
    logger.error({ error }, "Failed to get accounts for calendar sync");
  }
}

/**
 * Main sync function: polls for calendar changes and updates tasks for a
 * specific login account.
 */
async function syncCalendarChanges(userId: string): Promise<{
  synced: number;
  errors: number;
}> {
  const result = { synced: 0, errors: 0 };

  try {
    // Get current sync token from database
    const account = await prisma.account.findUnique({
      where: { id: userId },
    });

    if (!account) {
      logger.debug("Calendar sync: no account found, skipping");
      return result;
    }

    // Poll for changes
    const { events, nextSyncToken } = await listChangedEvents(userId, account.syncToken || undefined);

    if (!nextSyncToken) {
      logger.debug("Calendar sync: no next sync token returned, skipping");
      return result;
    }

    // Persist the new sync token
    await prisma.account.update({
      where: { id: userId },
      data:  { syncToken: nextSyncToken },
    });

    // Process each changed event
    for (const event of events) {
      try {
        await processEventChange(event, userId);
        result.synced++;
      } catch (error) {
        logger.error({ error, eventId: event.id }, "Failed to process calendar event change");
        result.errors++;
      }
    }

    if (result.synced > 0 || result.errors > 0) {
      logger.info(
        { synced: result.synced, errors: result.errors, userId },
        "Calendar sync completed"
      );
    }
  } catch (error) {
    logger.error({ error, userId }, "Calendar sync failed");
    result.errors++;
  }

  return result;
}

/**
 * Process a single calendar event change and update the corresponding task.
 */
async function processEventChange(event: {
  id: string;
  summary: string | null;
  description: string | null;
  start: { dateTime?: string; date?: string } | null;
  end: { dateTime?: string; date?: string } | null;
  status: string;
}, userId: string): Promise<void> {
  // Find task by Google event ID, scoped to this login account's service contacts
  const task = await prisma.task.findFirst({
    where: {
      googleEventId: event.id,
      contact: { ownerId: userId, isService: true },
    },
    include: { contact: true },
  });

  if (!task) {
    logger.debug({ eventId: event.id, userId }, "No task found for calendar event, skipping");
    return;
  }

  // Handle event deletion/cancellation
  if (event.status === "cancelled") {
    logger.info({ taskId: task.id, eventId: event.id }, "Calendar event cancelled, marking task as cancelled");

    await prisma.task.update({
      where: { id: task.id },
      data: {
        status:        "cancelled",
        googleEventId: null, // Clear the link since event is gone
        googleEtag:    null,
        lastSyncedAt:  new Date(),
      },
    });
    return;
  }

  // Extract date/time from event
  const eventStart = event.start?.dateTime || event.start?.date;
  const newDueDate = eventStart ? new Date(eventStart) : null;

  // Extract title (remove checkmark prefix if present)
  const newTitle = event.summary?.replace(/^✓\s*/, "") || task.title;

  // Build update data
  const updateData: {
    title?: string;
    dueDate?: Date | null;
    lastSyncedAt: Date;
  } = {
    lastSyncedAt: new Date(),
  };

  if (newTitle !== task.title) {
    updateData.title = newTitle;
  }

  if (newDueDate && (!task.dueDate || newDueDate.getTime() !== task.dueDate.getTime())) {
    updateData.dueDate = newDueDate;
  }

  // Only update if there are changes beyond lastSyncedAt
  if (Object.keys(updateData).length > 1) {
    logger.info(
      { taskId: task.id, eventId: event.id, changes: Object.keys(updateData) },
      "Updating task from calendar event"
    );

    await prisma.task.update({
      where: { id: task.id },
      data:  updateData,
    });
  }
}
