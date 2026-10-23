/**
 * Calendar → Task ingest.
 *
 * calendarSync.ts used to look events up ONLY by Task.googleEventId, i.e. it could react to events
 * the app itself had created, but an event the user typed straight into Google Calendar was
 * dropped ("No task found for calendar event, skipping"). This service closes that gap:
 *
 *   Google event "Call Sharma Clinic" 10:30  →  Task(kind=call, source=calendar, dueDate=10:30,
 *                                                    nextAttemptAt=10:30, googleEventId=<event id>)
 *
 * From there the existing machinery takes over: callScheduler fires at nextAttemptAt and the agent
 * places the call (services/agentCallTools.ts). Later edits to the event (moved / renamed /
 * cancelled) are handled by calendarSync.processEventChange because the task is now linked.
 */

import { prisma } from "@workspace/db-prisma";
import { logger } from "../lib/logger";
import { getOrCreateActiveConversation } from "./conversations";
import { nudgeScheduler } from "./callScheduler";
import {
  isCallEvent,
  isStillUpcoming,
  matchContact,
  type CalendarEventLike,
} from "./calendarEventParser";

/** Events that started up to this long ago are still ingested (sync can lag by a poll interval). */
const PAST_GRACE_MS = (Number(process.env.CALENDAR_INGEST_PAST_GRACE_MIN) || 10) * 60 * 1000;
const MAX_DESCRIPTION_CHARS = 1000;

export type IngestResult =
  | { status: "created"; taskId: string; contactId: string; dueDate: Date }
  | { status: "skipped"; reason: "not_call_event" | "past" | "no_match" | "ambiguous" | "duplicate" };

export async function ingestCalendarEvent(
  event: CalendarEventLike,
  userId: string,
  now: Date = new Date(),
): Promise<IngestResult> {
  if (!isCallEvent(event)) return { status: "skipped", reason: "not_call_event" };

  const startsAt = new Date(event.start!.dateTime!);
  if (Number.isNaN(startsAt.getTime()) || !isStillUpcoming(startsAt, now, PAST_GRACE_MS)) {
    return { status: "skipped", reason: "past" };
  }

  // Already ingested (or created by the app itself)? One task per event per account.
  const existing = await prisma.task.findFirst({
    where: { googleEventId: event.id, contact: { ownerId: userId } },
    select: { id: true },
  });
  if (existing) return { status: "skipped", reason: "duplicate" };

  const contacts = await prisma.account.findMany({
    where: { ownerId: userId, isService: true },
    select: { id: true, name: true, business: true, linkedAccountId: true },
  });

  const match = matchContact(event, contacts);
  if (!match.ok) {
    logger.info(
      { eventId: event.id, title: event.summary, reason: match.reason, candidates: match.candidates?.map((c) => c.name) },
      "calendarIngest: call event not matched to a single contact, skipping",
    );
    return { status: "skipped", reason: match.reason };
  }

  const contact = match.contact;
  const conversation = await getOrCreateActiveConversation(contact.id, "Call with", contact.name || "");

  const description = (event.description ?? "").trim().slice(0, MAX_DESCRIPTION_CHARS) || null;

  const task = await prisma.task.create({
    data: {
      title: (event.summary ?? `Call ${contact.name ?? ""}`).trim(),
      description,
      status: "open",
      kind: "call",
      source: "calendar",
      confidence: 1.0,
      priority: "normal",
      dueDate: startsAt,
      nextAttemptAt: startsAt, // the scheduler fires at exactly this instant
      callAttempts: 0,
      schedulerStatus: "pending",
      googleEventId: event.id,
      lastSyncedAt: now,
      conversationId: conversation.id,
      contactId: contact.id,
    },
    select: { id: true },
  });

  logger.info(
    { taskId: task.id, eventId: event.id, contactId: contact.id, dueDate: startsAt.toISOString(), dialable: !!contact.linkedAccountId },
    "calendarIngest: created call task from calendar event",
  );

  nudgeScheduler();
  return { status: "created", taskId: task.id, contactId: contact.id, dueDate: startsAt };
}
