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
import { isTestMode } from "../../lib/testMode";
import { getAuthedClient } from "./authClient";
import { GOOGLE_CALENDAR_ID } from "./config";

// S4: Fake calendar driver for testing
const FAKE_CALENDAR_EVENTS = new Map<string, any[]>();

/**
 * Create a Google Calendar event directly from request input (used by the
 * POST /calendar/events route).
 */
export async function insertCalendarEvent(
  client: InstanceType<typeof google.auth.OAuth2>,
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
  // S4: Fake calendar driver
  if (process.env.GOOGLE_CALENDAR_DRIVER === 'fake' && isTestMode()) {
    const fakeEvent = {
      id: `fake-${Date.now()}`,
      summary: input.summary,
      description: input.description || "",
      start: input.start || { dateTime: new Date().toISOString(), timeZone: "UTC" },
      end: input.end || { dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), timeZone: "UTC" },
      htmlLink: `https://calendar.google.com/event/fake-${Date.now()}`,
    };

    // Store in fake calendar
    const userId = (client as any).fakeUserId || 'test-user';
    if (!FAKE_CALENDAR_EVENTS.has(userId)) {
      FAKE_CALENDAR_EVENTS.set(userId, []);
    }
    FAKE_CALENDAR_EVENTS.get(userId)!.push(fakeEvent);

    logger.info({ event: fakeEvent }, "Fake calendar event created");
    return fakeEvent;
  }

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
export async function listAllCalendarEvents(client: InstanceType<typeof google.auth.OAuth2>): Promise<
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
  // S4: Fake calendar driver
  if (process.env.GOOGLE_CALENDAR_DRIVER === 'fake' && isTestMode()) {
    const userId = (client as any).fakeUserId || 'test-user';
    const events = FAKE_CALENDAR_EVENTS.get(userId) || [];
    logger.info({ eventCount: events.length }, "Fake calendar events fetched");
    return events;
  }

  const calendar = google.calendar({ version: "v3", auth: client });

  // singleEvents + orderBy:"startTime" requires a timeMin — default to
  // 1 year ago so we get a reasonable window without an unbounded scan.
  const timeMin = new Date();
  timeMin.setFullYear(timeMin.getFullYear() - 1);

  const response = await calendar.events.list({
    calendarId: GOOGLE_CALENDAR_ID,
    singleEvents: true,
    orderBy: "startTime",
    timeMin: timeMin.toISOString(),
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

export interface BusyInterval {
  start: Date;
  end: Date;
  /** Calendar event id, so callers can ignore their own holds. */
  eventId: string;
}

/** Private extended property that marks an event as an agent hold (used by the sweeper). */
export const HOLD_PROP = "phoneAgentHold";

/**
 * Timed events that block [startISO, endISO). Returns null when Calendar is not connected
 * or the request fails, so the caller can say "calendar unavailable" instead of "free".
 * Uses events.list (no extra OAuth scope; returns ids; skips all-day and "available" events).
 */
export async function getBusyIntervals(
  userId: string,
  startISO: string,
  endISO: string,
): Promise<BusyInterval[] | null> {
  // S4: Fake calendar driver
  if (process.env.GOOGLE_CALENDAR_DRIVER === 'fake' && isTestMode()) {
    const events = FAKE_CALENDAR_EVENTS.get(userId) || [];
    const busy = events
      .filter(e => e.status !== 'cancelled')
      .map(e => ({
        start: new Date(e.start.dateTime || e.start.date),
        end: new Date(e.end.dateTime || e.end.date),
        eventId: e.id,
      }));
    return busy;
  }

  const client = await getAuthedClient(userId);
  if (!client) return null;
  try {
    const calendar = google.calendar({ version: "v3", auth: client });
    const out: BusyInterval[] = [];
    let pageToken: string | undefined;
    for (let page = 0; page < 5; page++) {
      const r: any = await calendar.events.list({
        calendarId: GOOGLE_CALENDAR_ID,
        timeMin: startISO,
        timeMax: endISO,
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 250,
        pageToken,
      });
      for (const e of r.data.items ?? []) {
        if (e.status === "cancelled" || e.transparency === "transparent") continue;
        if (!e.start?.dateTime || !e.end?.dateTime || !e.id) continue; // all-day: not a blocker
        out.push({ start: new Date(e.start.dateTime), end: new Date(e.end.dateTime), eventId: e.id });
      }
      pageToken = r.data.nextPageToken || undefined;
      if (!pageToken) break;
    }
    return out;
  } catch (error) {
    logger.error({ error, userId }, "getBusyIntervals failed");
    return null;
  }
}

/** Create a tentative "HOLD: …" event. Returns its id, or null when Calendar is unavailable. */
export async function insertHoldEvent(
  userId: string,
  input: { label: string; start: Date; end: Date; callId: string },
): Promise<string | null> {
  // S4: Fake calendar driver
  if (process.env.GOOGLE_CALENDAR_DRIVER === 'fake' && isTestMode()) {
    const holdEvent = {
      id: `fake-hold-${Date.now()}`,
      summary: `HOLD: ${input.label}`,
      description: "Tentative slot held by Phone Agent during a live call.",
      start: { dateTime: input.start.toISOString(), timeZone: "UTC" },
      end: { dateTime: input.end.toISOString(), timeZone: "UTC" },
      status: 'confirmed',
      transparency: 'opaque',
    };

    if (!FAKE_CALENDAR_EVENTS.has(userId)) {
      FAKE_CALENDAR_EVENTS.set(userId, []);
    }
    FAKE_CALENDAR_EVENTS.get(userId)!.push(holdEvent);

    logger.info({ holdEvent, userId }, "Fake hold event created");
    return holdEvent.id;
  }

  const client = await getAuthedClient(userId);
  if (!client) return null;
  try {
    const calendar = google.calendar({ version: "v3", auth: client });
    const r = await calendar.events.insert({
      calendarId: GOOGLE_CALENDAR_ID,
      requestBody: {
        summary: `HOLD: ${input.label}`,
        description: "Tentative slot held by Phone Agent during a live call. Removed automatically if the call does not confirm it.",
        start: { dateTime: input.start.toISOString(), timeZone: "UTC" },
        end: { dateTime: input.end.toISOString(), timeZone: "UTC" },
        transparency: "opaque",
        extendedProperties: { private: { [HOLD_PROP]: "1", phoneAgentCallId: input.callId } },
      },
    });
    return r.data.id ?? null;
  } catch (error) {
    logger.error({ error, userId, callId: input.callId }, "insertHoldEvent failed");
    return null;
  }
}

/** Delete one event by id. A missing event (404/410) counts as success. */
export async function deleteCalendarEventById(userId: string, eventId: string): Promise<boolean> {
  // S4: Fake calendar driver
  if (process.env.GOOGLE_CALENDAR_DRIVER === 'fake' && isTestMode()) {
    const events = FAKE_CALENDAR_EVENTS.get(userId) || [];
    const index = events.findIndex(e => e.id === eventId);
    if (index >= 0) {
      events.splice(index, 1);
      logger.info({ eventId, userId }, "Fake calendar event deleted");
    }
    return true;
  }

  const client = await getAuthedClient(userId);
  if (!client) return false;
  try {
    const calendar = google.calendar({ version: "v3", auth: client });
    await calendar.events.delete({ calendarId: GOOGLE_CALENDAR_ID, eventId });
    return true;
  } catch (error: any) {
    const code = error?.code ?? error?.status ?? error?.response?.status;
    if (code === 404 || code === 410) return true;
    logger.error({ error, userId, eventId }, "deleteCalendarEventById failed");
    return false;
  }
}

/** All agent HOLD events on the calendar (any date), with their creation time. */
export async function listHoldEvents(userId: string): Promise<Array<{ id: string; created: Date | null }> | null> {
  // S4: Fake calendar driver
  if (process.env.GOOGLE_CALENDAR_DRIVER === 'fake' && isTestMode()) {
    const events = FAKE_CALENDAR_EVENTS.get(userId) || [];
    return events
      .filter(e => e.summary?.startsWith('HOLD:'))
      .map(e => ({ id: e.id, created: new Date() }));
  }

  const client = await getAuthedClient(userId);
  if (!client) return null;
  try {
    const calendar = google.calendar({ version: "v3", auth: client });
    const r = await calendar.events.list({
      calendarId: GOOGLE_CALENDAR_ID,
      privateExtendedProperty: [`${HOLD_PROP}=1`],
      maxResults: 250,
      showDeleted: false,
    });
    return (r.data.items ?? [])
      .filter((e) => e.id && e.status !== "cancelled")
      .map((e) => ({ id: e.id as string, created: e.created ? new Date(e.created) : null }));
  } catch (error) {
    logger.error({ error, userId }, "listHoldEvents failed");
    return null;
  }
}
