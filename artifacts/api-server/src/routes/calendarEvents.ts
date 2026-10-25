import { Router, type IRouter } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { logger } from "../lib/logger";
import { manualSync } from "../services/calendarSync";
import {
  getAuthedClientOrReason,
  insertCalendarEvent,
  listAllCalendarEvents,
} from "../services/googleCalendar";
import { deleteCalendarEventById } from "../services/googleCalendar/eventsApi";
import { prisma } from "@workspace/db-prisma";

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
// POST /sync
// Manually trigger calendar sync
// ---------------------------------------------------------------------------
router.post("/sync", asyncHandler(async (req, res) => {
  try {
    const result = await manualSync(req.userId!);
    res.json(result);
  } catch (error) {
    logger.error({ error }, "Failed to trigger manual calendar sync");
    res.status(500).json({ error: "Failed to trigger sync" });
  }
}, "Failed to trigger manual calendar sync"));

// ---------------------------------------------------------------------------
// POST /
// Create a new Google Calendar event
// ---------------------------------------------------------------------------
router.post("/", asyncHandler(async (req, res) => {
  try {
    logger.info("Creating Google Calendar event");

    const authed = await getAuthedClientOrReason(req.userId!);
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
// GET /
// Fetch Google Calendar events directly
// ---------------------------------------------------------------------------
router.get("/", asyncHandler(async (req, res) => {
  try {
    logger.info("Fetching Google Calendar events");

    const authed = await getAuthedClientOrReason(req.userId!);
    if (!authed.ok) {
      // If not connected to Google Calendar, return events from database
      logger.info("Google Calendar not connected, returning database events");
      const tasks = await prisma.task.findMany({
        where: {
          contact: {
            ownerId: req.userId!,
          },
          googleEventId: { not: null },
          status: { not: 'cancelled' },
        },
        select: {
          id: true,
          title: true,
          description: true,
          dueDate: true,
          googleEventId: true,
          googleEtag: true,
        },
      });
      
      const events = tasks.map(task => ({
        id: task.googleEventId || task.id,
        summary: task.title,
        description: task.description,
        start: { dateTime: task.dueDate || undefined },
        end: { dateTime: task.dueDate || undefined },
        status: 'confirmed',
        htmlLink: `https://calendar.google.com/calendar/event?eid=${task.googleEventId}`,
      }));
      
      res.json({ events });
      return;
    }

    const events = await listAllCalendarEvents(authed.client);
    res.json({ events });
  } catch (error) {
    logger.error({ error }, "Failed to fetch Google Calendar events");
    res.status(500).json({ error: "Failed to fetch calendar events" });
  }
}, "Failed to fetch Google Calendar events"));

// ---------------------------------------------------------------------------
// DELETE /:eventId
// Delete a Google Calendar event
// ---------------------------------------------------------------------------
router.delete("/:eventId", asyncHandler(async (req, res) => {
  try {
    logger.info({ eventId: req.params.eventId }, "Deleting Google Calendar event");

    const success = await deleteCalendarEventById(req.userId!, req.params.eventId);
    if (!success) {
      res.status(500).json({ error: "Failed to delete calendar event" });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    logger.error({ error, eventId: req.params.eventId }, "Failed to delete Google Calendar event");
    res.status(500).json({ error: "Failed to delete calendar event" });
  }
}, "Failed to delete Google Calendar event"));

export default router;