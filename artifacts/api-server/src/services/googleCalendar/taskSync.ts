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

/**
 * Create a Google Calendar event from a task.
 * Returns the event ID or null if creation failed.
 */
export async function createEvent(task: {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  contact: { name: string; business: string };
}): Promise<string | null> {
  const auth = await getAuthedClient();
  if (!auth) {
    logger.warn("Cannot create calendar event: no authenticated client");
    return null;
  }

  try {
    const calendar = google.calendar({ version: "v3", auth });

    if (!task.dueDate) {
      logger.debug({ taskId: task.id }, "Skipping calendar event creation: no due date");
      return null;
    }

    const startTime = new Date(task.dueDate);
    const endTime = new Date(startTime.getTime() + DEFAULT_EVENT_DURATION_MINUTES * 60000);

    const description = task.description
      ? `${task.description}\n\nContact: ${task.contact.name} (${task.contact.business})`
      : `Contact: ${task.contact.name} (${task.contact.business})`;

    const event = {
      summary: task.title,
      description,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: "UTC",
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: "UTC",
      },
    };

    const response = await calendar.events.insert({
      calendarId: GOOGLE_CALENDAR_ID,
      requestBody: event,
    });

    const eventId = response.data.id;
    if (eventId) {
      logger.info({ taskId: task.id, eventId }, "Created Google Calendar event");

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
  contact: { name: string; business: string };
}): Promise<boolean> {
  const auth = await getAuthedClient();
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

    const startTime = task.dueDate ? new Date(task.dueDate) : new Date(existingEvent.data.start?.dateTime || Date.now());
    const endTime = task.dueDate
      ? new Date(startTime.getTime() + DEFAULT_EVENT_DURATION_MINUTES * 60000)
      : new Date(existingEvent.data.end?.dateTime || Date.now() + DEFAULT_EVENT_DURATION_MINUTES * 60000);

    const description = task.description
      ? `${task.description}\n\nContact: ${task.contact.name} (${task.contact.business})`
      : `Contact: ${task.contact.name} (${task.contact.business})`;

    // If task is done, prefix title with checkmark
    const summary = task.status === "done" ? `✓ ${task.title}` : task.title;

    const event = {
      summary,
      description,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: "UTC",
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: "UTC",
      },
    };

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
}): Promise<boolean> {
  const auth = await getAuthedClient();
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

/**
 * List changed events using incremental sync with syncToken.
 * Returns the new syncToken and array of changed events.
 */
export async function listChangedEvents(syncToken?: string): Promise<{
  events: Array<{
    id: string;
    summary: string | null;
    description: string | null;
    start: { dateTime?: string; date?: string } | null;
    end: { dateTime?: string; date?: string } | null;
    status: string;
  }>;
  nextSyncToken: string | null;
}> {
  const auth = await getAuthedClient();
  if (!auth) {
    logger.warn("Cannot list calendar events: no authenticated client");
    return { events: [], nextSyncToken: null };
  }

  try {
    const calendar = google.calendar({ version: "v3", auth });

    const response = await calendar.events.list({
      calendarId: GOOGLE_CALENDAR_ID,
      syncToken: syncToken,
    });

    const events = (response.data.items || []).map((event) => ({
      id: event.id || "",
      summary: event.summary || null,
      description: event.description || null,
      start: event.start || null,
      end: event.end || null,
      status: event.status || "",
    }));

    const nextSyncToken = response.data.nextSyncToken || null;

    // Update sync token in database if we got a new one
    if (nextSyncToken) {
      await prisma.googleAuth.update({
        where: { id: "default" },
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
  contact: { name: string; business: string };
}): Promise<boolean> {
  try {
    if (!task.dueDate) {
      // If no due date, delete existing event if any
      if (task.googleEventId) {
        return await deleteEvent({ id: task.id, googleEventId: task.googleEventId });
      }
      return true;
    }

    if (task.googleEventId) {
      // Update existing event
      return await updateEvent({
        ...task,
        googleEventId: task.googleEventId,
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
