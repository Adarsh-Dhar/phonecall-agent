/**
 * Direct Google Calendar event operations.
 *
 * These take an already-authenticated client (from authClient.ts) and are
 * used by the POST/GET /calendar/events routes. Distinct from taskSync.ts,
 * which builds events from Tasks and manages the create/update/delete
 * lifecycle tied to task state.
 */

import { google } from "googleapis";
import { logger } from "../../lib/logger";
import { GOOGLE_CALENDAR_ID } from "./config";

/**
 * Create a Google Calendar event directly from request input (used by the
 * POST /calendar/events route).
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
 * Distinct from listChangedEvents() in taskSync.ts, which does incremental
 * sync pulls.
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
