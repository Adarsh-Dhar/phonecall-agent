/**
 * Google Calendar Service
 *
 * Handles all Google Calendar API operations including OAuth token management,
 * event creation/update/deletion, and incremental sync polling.
 */

import { prisma } from "@workspace/db-prisma";
import { google } from "googleapis";
import { logger } from "../lib/logger";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "primary";

// Default event duration in minutes if dueDate is set
const DEFAULT_EVENT_DURATION_MINUTES = 30;

// ---------------------------------------------------------------------------
// OAuth Client Management
// ---------------------------------------------------------------------------

/**
 * Get an authenticated OAuth2 client with auto-refresh capabilities.
 * Loads tokens from database, refreshes if expired, and persists new tokens.
 */
export async function getAuthedClient(): Promise<google.auth.OAuth2 | null> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    logger.warn("Google OAuth credentials not configured");
    return null;
  }

  try {
    const auth = await prisma.googleAuth.findUnique({
      where: { id: "default" },
    });

    if (!auth) {
      logger.debug("No Google auth credentials found in database");
      return null;
    }

    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: auth.accessToken,
      refresh_token: auth.refreshToken,
      expiry_date: auth.expiryDate.getTime(),
    });

    // Set up token refresh handler
    oauth2Client.on("tokens", async (tokens) => {
      try {
        logger.info("Google OAuth tokens refreshed, persisting to database");
        
        const newExpiryDate = new Date(
          Date.now() + (tokens.expiry_date || 3600000)
        );

        await prisma.googleAuth.update({
          where: { id: "default" },
          data: {
            accessToken: tokens.access_token || auth.accessToken,
            expiryDate: newExpiryDate,
          },
        });
      } catch (error) {
        logger.error({ error }, "Failed to persist refreshed Google OAuth tokens");
      }
    });

    // Check if token is expired and refresh if needed
    if (auth.expiryDate < new Date()) {
      logger.info("Google OAuth token expired, attempting refresh");
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        logger.info("Google OAuth token refreshed successfully");
      } catch (error) {
        logger.error({ error }, "Failed to refresh Google OAuth token");
        return null;
      }
    }

    return oauth2Client;
  } catch (error) {
    logger.error({ error }, "Failed to get authenticated Google client");
    return null;
  }
}

/**
 * Like getAuthedClient(), but distinguishes *why* no client is available so
 * callers (routes) can return the right HTTP status: 404 when Calendar was
 * never connected, 401 when the stored token is there but refresh failed.
 */
export type AuthedClientResult =
  | { ok: true; client: google.auth.OAuth2 }
  | { ok: false; reason: "not_connected" }
  | { ok: false; reason: "refresh_failed" };

export async function getAuthedClientOrReason(): Promise<AuthedClientResult> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    return { ok: false, reason: "not_connected" };
  }

  const auth = await prisma.googleAuth.findUnique({
    where: { id: "default" },
  });

  if (!auth) {
    logger.warn("Google Calendar not connected - no auth found");
    return { ok: false, reason: "not_connected" };
  }

  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: auth.accessToken,
    refresh_token: auth.refreshToken,
    expiry_date: auth.expiryDate.getTime(),
  });

  // Check if token is expired and refresh if needed
  if (auth.expiryDate < new Date()) {
    logger.info("Token expired, refreshing...");
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      logger.info("Google OAuth token refreshed successfully");

      // Update tokens in database
      const newExpiryDate = new Date(
        Date.now() + (credentials.expiry_date || 3600000)
      );

      await prisma.googleAuth.update({
        where: { id: "default" },
        data: {
          accessToken: credentials.access_token || auth.accessToken,
          expiryDate: newExpiryDate,
        },
      });

      // Update the client with the new token
      oauth2Client.setCredentials({
        access_token: credentials.access_token || auth.accessToken,
        refresh_token: auth.refreshToken,
        expiry_date: newExpiryDate.getTime(),
      });
    } catch (error) {
      logger.error({ error }, "Failed to refresh Google OAuth token");
      return { ok: false, reason: "refresh_failed" };
    }
  }

  return { ok: true, client: oauth2Client };
}

/**
 * Create a Google Calendar event directly from request input (used by the
 * POST /calendar/events route). Distinct from createEvent() below, which
 * builds an event from a Task.
 */
export async function insertCalendarEvent(
  client: google.auth.OAuth2,
  input: {
    summary: string;
    description?: string;
    start?: { dateTime?: string; date?: string; timeZone?: string };
    end?: { dateTime?: string; date?: string; timeZone?: string };
  }
): Promise<{
  id: string | null | undefined;
  summary: string | null | undefined;
  description: string | null | undefined;
  start: unknown;
  end: unknown;
  htmlLink: string | null | undefined;
}> {
  const calendar = google.calendar({ version: "v3", auth: client });

  const event = {
    summary: input.summary,
    description: input.description || "",
    start: input.start || {
      dateTime: new Date().toISOString(),
      timeZone: "UTC",
    },
    end: input.end || {
      dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
      timeZone: "UTC",
    },
  };

  logger.info({ event }, "Creating calendar event");

  const response = await calendar.events.insert({
    calendarId: GOOGLE_CALENDAR_ID,
    requestBody: event,
  });

  logger.info({ eventId: response.data.id }, "Google Calendar event created successfully");

  return {
    id: response.data.id,
    summary: response.data.summary,
    description: response.data.description,
    start: response.data.start,
    end: response.data.end,
    htmlLink: response.data.htmlLink,
  };
}

/**
 * List all events on the connected calendar (used by GET /calendar/events).
 * Distinct from listChangedEvents() below, which does incremental sync pulls.
 */
export async function listAllCalendarEvents(client: google.auth.OAuth2): Promise<
  Array<{
    id: string | null | undefined;
    summary: string;
    description: string | null;
    start: unknown;
    end: unknown;
    status: string | null | undefined;
    htmlLink: string | null | undefined;
  }>
> {
  const calendar = google.calendar({ version: "v3", auth: client });

  // Get events without time filter to show all events
  const response = await calendar.events.list({
    calendarId: GOOGLE_CALENDAR_ID,
    singleEvents: true,
    orderBy: "startTime",
  });

  logger.info({ eventCount: response.data.items?.length || 0 }, "Fetched Google Calendar events");

  return (response.data.items || []).map((event) => ({
    id: event.id,
    summary: event.summary || "No title",
    description: event.description || null,
    start: event.start,
    end: event.end,
    status: event.status,
    htmlLink: event.htmlLink,
  }));
}

// ---------------------------------------------------------------------------
// Calendar API Operations
// ---------------------------------------------------------------------------

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