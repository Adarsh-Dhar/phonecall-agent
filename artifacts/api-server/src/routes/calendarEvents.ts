import { Router, type IRouter } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { logger } from "../lib/logger";
import { manualSync } from "../services/calendarSync";
import {
  getAuthedClientOrReason,
  insertCalendarEvent,
  listAllCalendarEvents,
} from "../services/googleCalendar";

const router: IRouter = Router();

/** Maps a failed-auth reason to the HTTP status/body the frontend already expects. */
function sendAuthFailure(res: import("express").Response, reason: "not_connected" | "refresh_failed") {
  if (reason === "not_connected") {
    res.status(404).json({ error: "Google Calendar not connected" });
  } else {
    res.status(401).json({ error: "Google Calendar token expired, please reconnect" });
  }
}

// ---------------------------------------------------------------------------
// POST /calendar/sync
// Manually trigger calendar sync
// ---------------------------------------------------------------------------
router.post("/calendar/sync", asyncHandler(async (req, res) => {
  try {
    const result = await manualSync();
    res.json(result);
  } catch (error) {
    logger.error({ error }, "Failed to trigger manual calendar sync");
    res.status(500).json({ error: "Failed to trigger sync" });
  }
}, "Failed to trigger manual calendar sync"));

// ---------------------------------------------------------------------------
// POST /calendar/events
// Create a new Google Calendar event
// ---------------------------------------------------------------------------
router.post("/calendar/events", asyncHandler(async (req, res) => {
  try {
    logger.info("Creating Google Calendar event");

    const authed = await getAuthedClientOrReason();
    if (!authed.ok) {
      sendAuthFailure(res, authed.reason);
      return;
    }

    const { summary, description, start, end } = req.body;

    if (!summary) {
      res.status(400).json({ error: "Summary is required" });
      return;
    }

    const event = await insertCalendarEvent(authed.client, { summary, description, start, end });
    res.json(event);
  } catch (error) {
    logger.error({ error }, "Failed to create Google Calendar event");
    res.status(500).json({ error: "Failed to create calendar event" });
  }
}, "Failed to create Google Calendar event"));

// ---------------------------------------------------------------------------
// GET /calendar/events
// Fetch Google Calendar events directly
// ---------------------------------------------------------------------------
router.get("/calendar/events", asyncHandler(async (req, res) => {
  try {
    logger.info("Fetching Google Calendar events");

    const authed = await getAuthedClientOrReason();
    if (!authed.ok) {
      sendAuthFailure(res, authed.reason);
      return;
    }

    const events = await listAllCalendarEvents(authed.client);
    res.json({ events });
  } catch (error) {
    logger.error({ error }, "Failed to fetch Google Calendar events");
    res.status(500).json({ error: "Failed to fetch calendar events" });
  }
}, "Failed to fetch Google Calendar events"));

export default router;