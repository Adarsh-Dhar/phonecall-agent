/**
 * Task <-> Google Calendar sync engine.
 *
 * Builds calendar events from Tasks and keeps googleEventId/googleEtag/
 * lastSyncedAt on the Task in sync with the remote event's lifecycle
 * (create, update, delete, and incremental pull via syncToken).
 */

import { prisma } from "@workspace/db-prisma";
import { google } from "googleapis";
import { logger } from "../../lib/logger";
import { getAuthedClient } from "./authClient";
import { GOOGLE_CALENDAR_ID, DEFAULT_EVENT_DURATION_MINUTES } from "./config";
import { normalizeKind, firstFireAt } from "../taskKinds";

const PREFIX: Record<string, string> = {
  pay: "Pay: ",
  bring: "Bring: ",
  submit: "Submit: ",
  appointment: "",
  follow_up: "Follow-up: ",
  call: "Call: ",
  other: "",
};

const MINUTES: Record<string, number> = {
  appointment: 60,
  call: 15,
  follow_up: 15,
  bring: 15,
  pay: 15,
  submit: 15,
  other: 15,
};

/**
 * Create a Google Calendar event from a task.
 * Returns the event ID or null if creation failed.
 */
export async function createEvent(task: {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  kind: string;
  meta: Record<string, unknown> | null;
  contact: { name: string; business: string | null };
  userId: string;
}): Promise<string | null> {
  logger.info({ 
    taskId: task.id, 
    userId: task.userId,
    taskTitle: task.title,
    contactName: task.contact.name 
  }, "taskSync: attempting to create calendar event");
  
  const auth = await getAuthedClient(task.userId);
  if (!auth) {
    logger.warn({ userId: task.userId }, "Cannot create calendar event: no authenticated client");
    return null;
  }

  try {
    const calendar = google.calendar({ version: "v3", auth });

    if (!task.dueDate) {
      logger.debug({ taskId: task.id }, "Skipping calendar event creation: no due date");
      return null;
    }

    const kind = normalizeKind(task.kind);
    const duration = MINUTES[kind] || DEFAULT_EVENT_DURATION_MINUTES;
    const prefix = PREFIX[kind] || "";
    const allDay = typeof task.meta === 'object' && task.meta?.allDay === true;

    const startTime = new Date(task.dueDate);
    const endTime = allDay 
      ? new Date(startTime.getTime() + 24 * 60 * 60 * 1000) // All-day events end at midnight next day
      : new Date(startTime.getTime() + duration * 60000);

    const description = task.description
      ? `${task.description}\n\nContact: ${task.contact.name} (${task.contact.business ?? ""})`
      : `Contact: ${task.contact.name} (${task.contact.business ?? ""})`;

    const event: any = {
      summary: `${prefix}${task.title}`,
      description,
    };

    if (allDay) {
      event.start = { date: startTime.toISOString().split('T')[0] };
      event.end = { date: endTime.toISOString().split('T')[0] };
    } else {
      event.start = {
        dateTime: startTime.toISOString(),
        timeZone: "UTC",
      };
      event.end = {
        dateTime: endTime.toISOString(),
        timeZone: "UTC",
      };
    }

    const response = await calendar.events.insert({
      calendarId: GOOGLE_CALENDAR_ID,
      requestBody: event,
    });

    const eventId = response.data.id;
    if (eventId) {
      logger.info({ 
        taskId: task.id, 
        eventId, 
        eventTitle: event.summary,
        calendarId: GOOGLE_CALENDAR_ID,
        userId: task.userId 
      }, "Created Google Calendar event");

      // Update task with Google event ID
      await prisma.task.update({
        where: { id: task.id },
        data: {
          googleEventId: eventId,
          googleEtag: response.data.etag || null,
          lastSyncedAt: new Date(),
        },
      });
    }

    return eventId || null;
  } catch (error) {
    logger.error({ error, taskId: task.id }, "Failed to create Google Calendar event");
    return null;
  }
}

/**
 * Update an existing Google Calendar event from a task.
 * Returns true if update succeeded, false otherwise.
 */
export async function updateEvent(task: {
  id: string;
  googleEventId: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  status: string;
  kind: string;
  meta: Record<string, unknown> | null;
  contact: { name: string; business: string | null };
  userId: string;
}): Promise<boolean> {
  const auth = await getAuthedClient(task.userId);
  if (!auth) {
    logger.warn("Cannot update calendar event: no authenticated client");
    return false;
  }

  try {
    const calendar = google.calendar({ version: "v3", auth });

    // First get the existing event to check if it still exists
    const existingEvent = await calendar.events.get({
      calendarId: GOOGLE_CALENDAR_ID,
      eventId: task.googleEventId,
    });

    if (!existingEvent.data.id) {
      logger.warn({ taskId: task.id, eventId: task.googleEventId }, "Google Calendar event not found, may have been deleted");
      // Clear the Google event ID from task
      await prisma.task.update({
        where: { id: task.id },
        data: { googleEventId: null, googleEtag: null, lastSyncedAt: null },
      });
      return false;
    }

    const kind = normalizeKind(task.kind);
    const duration = MINUTES[kind] || DEFAULT_EVENT_DURATION_MINUTES;
    const prefix = PREFIX[kind] || "";
    const allDay = typeof task.meta === 'object' && task.meta?.allDay === true;

    const startTime = task.dueDate ? new Date(task.dueDate) : new Date(existingEvent.data.start?.dateTime || Date.now());
    const endTime = task.dueDate
      ? (allDay 
          ? new Date(startTime.getTime() + 24 * 60 * 60 * 1000)
          : new Date(startTime.getTime() + duration * 60000))
      : new Date(existingEvent.data.end?.dateTime || Date.now() + DEFAULT_EVENT_DURATION_MINUTES * 60000);

    // Reset scheduler fields when due date changes via calendar sync
    if (task.dueDate) {
      const owner = await prisma.account.findUnique({
        where: { id: task.userId },
        select: { timezone: true },
      });
      const tz = owner?.timezone ?? "UTC";
      await prisma.task.update({
        where: { id: task.id },
        data: {
          nextAttemptAt: firstFireAt(kind, task.dueDate, tz),
          callAttempts: 0,
          schedulerStatus: "pending",
        },
      });
    }

    const description = task.description
      ? `${task.description}\n\nContact: ${task.contact.name} (${task.contact.business ?? ""})`
      : `Contact: ${task.contact.name} (${task.contact.business ?? ""})`;

    // If task is done, prefix title with checkmark
    const summary = task.status === "done" ? `✓ ${prefix}${task.title}` : `${prefix}${task.title}`;

    const event: any = {
      summary,
      description,
    };

    if (allDay) {
      event.start = { date: startTime.toISOString().split('T')[0] };
      event.end = { date: endTime.toISOString().split('T')[0] };
    } else {
      event.start = {
        dateTime: startTime.toISOString(),
        timeZone: "UTC",
      };
      event.end = {
        dateTime: endTime.toISOString(),
        timeZone: "UTC",
      };
    }

    const response = await calendar.events.update({
      calendarId: GOOGLE_CALENDAR_ID,
      eventId: task.googleEventId,
      requestBody: event,
    });

    logger.info({ taskId: task.id, eventId: task.googleEventId }, "Updated Google Calendar event");

    // Update task with new etag
    await prisma.task.update({
      where: { id: task.id },
      data: {
        googleEtag: response.data.etag || null,
        lastSyncedAt: new Date(),
      },
    });

    return true;
  } catch (error) {
    logger.error({ error, taskId: task.id, eventId: task.googleEventId }, "Failed to update Google Calendar event");
    return false;
  }
}

/**
 * Delete a Google Calendar event.
 * Returns true if deletion succeeded, false otherwise.
 */
export async function deleteEvent(task: {
  id: string;
  googleEventId: string;
  userId: string;
}): Promise<boolean> {
  const auth = await getAuthedClient(task.userId);
  if (!auth) {
    logger.warn("Cannot delete calendar event: no authenticated client");
    return false;
  }

  try {
    const calendar = google.calendar({ version: "v3", auth });

    await calendar.events.delete({
      calendarId: GOOGLE_CALENDAR_ID,
      eventId: task.googleEventId,
    });

    logger.info({ taskId: task.id, eventId: task.googleEventId }, "Deleted Google Calendar event");

    // Clear Google event data from task
    await prisma.task.update({
      where: { id: task.id },
      data: {
        googleEventId: null,
        googleEtag: null,
        lastSyncedAt: null,
      },
    });

    return true;
  } catch (error) {
    logger.error({ error, taskId: task.id, eventId: task.googleEventId }, "Failed to delete Google Calendar event");
    return false;
  }
}

/** One event as returned by listChangedEvents(), flattened to what calendarSync/calendarIngest need. */
export interface ChangedCalendarEvent {
  id: string;
  summary: string | null;
  description: string | null;
  start: { dateTime?: string; date?: string } | null;
  end: { dateTime?: string; date?: string } | null;
  status: string;
  /** True when the signed-in user created / organizes the event (false for invites from others). */
  creatorSelf: boolean;
  organizerSelf: boolean;
}

/** How far back the very first (token-less) sync looks. Anything older can never trigger a call. */
const INITIAL_SYNC_LOOKBACK_MS = 24 * 60 * 60 * 1000;
const MAX_SYNC_PAGES = 20;

function isGoneError(error: any): boolean {
  return error?.code === 410 || error?.status === 410 || error?.response?.status === 410;
}

/**
 * List changed events using incremental sync with syncToken.
 * Returns the new syncToken and array of changed events.
 *
 * - singleEvents: true expands recurring events into concrete instances, each with its own exact
 *   start time (a recurring "Call the bank" fires on every occurrence, not only the first).
 * - Follows nextPageToken: Google only returns nextSyncToken on the LAST page, so reading one page
 *   silently broke sync for calendars with more than 250 changed events.
 * - HTTP 410 (sync token expired/invalidated) clears the stored token and restarts with a full sync
 *   instead of failing forever.
 */
export async function listChangedEvents(userId: string, syncToken?: string): Promise<{
  events: ChangedCalendarEvent[];
  nextSyncToken: string | null;
}> {
  const auth = await getAuthedClient(userId);
  if (!auth) {
    logger.warn("Cannot list calendar events: no authenticated client");
    return { events: [], nextSyncToken: null };
  }

  const calendar = google.calendar({ version: "v3", auth });

  const fetchAll = async (token?: string) => {
    const items: any[] = [];
    let pageToken: string | undefined;
    let nextSyncToken: string | null = null;

    for (let page = 0; page < MAX_SYNC_PAGES; page++) {
      const response: any = await calendar.events.list({
        calendarId: GOOGLE_CALENDAR_ID,
        singleEvents: true,
        maxResults: 250,
        pageToken,
        // Google rejects timeMin together with syncToken, so only the initial sync is windowed.
        ...(token
          ? { syncToken: token }
          : { timeMin: new Date(Date.now() - INITIAL_SYNC_LOOKBACK_MS).toISOString() }),
      });
      items.push(...(response.data.items || []));
      pageToken = response.data.nextPageToken || undefined;
      if (!pageToken) {
        nextSyncToken = response.data.nextSyncToken || null;
        break;
      }
    }
    return { items, nextSyncToken };
  };

  try {
    let result;
    try {
      result = await fetchAll(syncToken);
    } catch (error) {
      if (!syncToken || !isGoneError(error)) throw error;
      logger.warn({ userId }, "Calendar sync token expired (410), restarting with a full sync");
      await prisma.account.update({ where: { id: userId }, data: { syncToken: null } });
      result = await fetchAll(undefined);
    }

    const events: ChangedCalendarEvent[] = result.items.map((event: any) => ({
      id: event.id || "",
      summary: event.summary || null,
      description: event.description || null,
      start: event.start
        ? { dateTime: event.start.dateTime || undefined, date: event.start.date || undefined }
        : null,
      end: event.end
        ? { dateTime: event.end.dateTime || undefined, date: event.end.date || undefined }
        : null,
      status: event.status || "",
      creatorSelf: event.creator?.self === true,
      organizerSelf: event.organizer?.self === true,
    }));

    const nextSyncToken = result.nextSyncToken;

    // Update sync token in database if we got a new one
    if (nextSyncToken) {
      await prisma.account.update({
        where: { id: userId },
        data: { syncToken: nextSyncToken },
      });
    }

    logger.info({ eventCount: events.length, hasSyncToken: !!syncToken }, "Listed changed Google Calendar events");

    return { events, nextSyncToken };
  } catch (error) {
    logger.error({ error }, "Failed to list changed Google Calendar events");
    return { events: [], nextSyncToken: null };
  }
}

/**
 * Sync a task to Google Calendar (create or update).
 * This is a convenience function that handles both cases.
 */
export async function syncTaskToCalendar(task: {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  status: string;
  googleEventId: string | null;
  kind: string;
  meta: Record<string, unknown> | null;
  contact: { name: string; business: string | null };
  userId: string;
}): Promise<boolean> {
  try {
    // A cancelled task shouldn't keep occupying the calendar — remove the
    // event entirely rather than just updating its title.
    if (task.status === "cancelled") {
      if (task.googleEventId) {
        return await deleteEvent({ id: task.id, googleEventId: task.googleEventId, userId: task.userId });
      }
      return true;
    }

    if (!task.dueDate) {
      // If no due date, delete existing event if any
      if (task.googleEventId) {
        return await deleteEvent({ id: task.id, googleEventId: task.googleEventId, userId: task.userId });
      }
      return true;
    }

    if (task.googleEventId) {
      // Update existing event
      return await updateEvent({
        ...task,
        googleEventId: task.googleEventId,
        userId: task.userId,
      });
    } else {
      // Create new event
      const eventId = await createEvent(task);
      return eventId !== null;
    }
  } catch (error) {
    logger.error({ error, taskId: task.id }, "Failed to sync task to Google Calendar");

    // Mark lastSyncedAt as null to indicate sync failure
    await prisma.task.update({
      where: { id: task.id },
      data: { lastSyncedAt: null },
    });

    return false;
  }
}
