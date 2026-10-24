import { prisma } from "@workspace/db-prisma";
import { logger } from "../lib/logger";
import { firstFireAt, normalizeKind, allowsDateOnly, sanitizeMeta, syncsToCalendar } from "./taskKinds";
import { parseModelDueDate } from "./taskExtraction/validate";
import { syncTaskToCalendar } from "./googleCalendar";
import { pickHoldFor } from "./callCalendarTools";
import type { Prisma } from "@workspace/db-prisma";

type FollowUp = { kind: string; title: string; dueAt?: string; details?: string };
const ACTIVE = ["suggested", "open", "in_progress", "waiting_user"];

export interface PostCallResult {
  /** Calendar event (an agent HOLD) that became the appointment's event. Caller must not delete it. */
  adoptedEventId?: string;
}

export async function applyPostCallTasks(
  callId: string,
  followUps: FollowUp[] = [],
  opts: { holds?: Array<{ eventId: string; start: Date }> } = {},
): Promise<PostCallResult> {
  const touched = new Set<string>();
  const result: PostCallResult = {};
  try {
    await applyTasks(callId, followUps, opts, touched, result);
  } finally {
    await syncTouchedToCalendar(callId, touched);
  }
  return result;
}

async function syncTouchedToCalendar(callId: string, touched: Set<string>) {
  if (touched.size === 0) return;
  try {
    const call = await prisma.call.findUnique({ where: { id: callId }, select: { individualId: true } });
    const tasks = await prisma.task.findMany({
      where: { id: { in: [...touched] } },
      include: { contact: true },
    });
    await Promise.allSettled(
      tasks
        .filter((t) => syncsToCalendar(normalizeKind(t.kind)))
        .map((t) => {
          // Login account that owns the Google tokens: the call's individual, else the contact's owner.
          const userId = call?.individualId ?? t.contact.ownerId;
          if (!userId) return Promise.resolve(false);
          return syncTaskToCalendar({
            id: t.id,
            title: t.title,
            description: t.description,
            dueDate: t.dueDate,
            status: t.status,
            googleEventId: t.googleEventId,
            kind: t.kind,
            meta: t.meta as Record<string, unknown> | null,
            contact: { name: t.contact.name || "", business: t.contact.business || "" },
            userId,
          }).catch((err) => {
            logger.error({ err, taskId: t.id }, "postCallTasks: calendar sync failed");
            return false;
          });
        }),
    );
  } catch (err) {
    logger.error({ err, callId }, "postCallTasks: calendar sync step failed");
  }
}

async function applyTasks(
  callId: string,
  followUps: FollowUp[],
  opts: { holds?: Array<{ eventId: string; start: Date }> },
  touched: Set<string>,
  result: PostCallResult,
) {
  const call = await prisma.call.findUnique({ where: { id: callId } });
  if (!call) return;

  const owner = await prisma.account.findUnique({
    where: { id: call.individualId },
    select: { timezone: true },
  });
  const tz = owner?.timezone ?? "UTC";
  const now = new Date();

  const existing = await prisma.task.findFirst({
    where: { contactId: call.contactId, kind: "appointment", status: { in: ACTIVE } },
    orderBy: { dueDate: "asc" },
  });

  // 1. cancelled: cancel the appointment and its children
  if (call.outcome === "cancelled" && existing) {
    const where = { OR: [{ id: existing.id }, { parentTaskId: existing.id }], status: { in: ACTIVE } };
    // updateMany returns only a count, and the calendar sync needs the ids.
    const ids = await prisma.task.findMany({ where, select: { id: true } });
    await prisma.task.updateMany({ where, data: { status: "cancelled", schedulerStatus: "done" } });
    ids.forEach((t) => touched.add(t.id));
    return;
  }

  // 2. booked / rescheduled: upsert the appointment from confirmedAt
  let appointmentId: string | undefined;
  const due = call.confirmedAt && call.confirmedAt > now ? call.confirmedAt : null;
  if (call.outcome === "booked" || call.outcome === "rescheduled") {
    if (!due) {
      logger.warn({ callId }, "postCallTasks: booked/rescheduled without a usable confirmedAt, no appointment created");
    } else {
      const data = {
        dueDate: due,
        nextAttemptAt: firstFireAt("appointment", due, tz, now),
        callAttempts: 0,
        schedulerStatus: "pending",
        meta: sanitizeMeta("appointment", { ref: call.confirmationRef }) as any,
      };
      if (call.outcome === "rescheduled" && existing) {
        const delta = +due - +(existing.dueDate ?? due);
        // Adopt the hold only when the appointment has no calendar event yet.
        const adopt = existing.googleEventId ? undefined : pickHoldFor(due, opts.holds ?? []);
        const t = await prisma.task.update({
          where: { id: existing.id },
          data: adopt ? { ...data, googleEventId: adopt } : data,
        });
        if (adopt) result.adoptedEventId = adopt;
        appointmentId = t.id;
        touched.add(t.id);
        const kids = await prisma.task.findMany({ where: { parentTaskId: t.id, status: { in: ACTIVE } } });
        for (const k of kids) {
          if (k.dueDate) {
            const nd = new Date(+k.dueDate + delta);
            await prisma.task.update({
              where: { id: k.id },
              data: {
                dueDate: nd,
                nextAttemptAt: firstFireAt(normalizeKind(k.kind), nd, tz, now),
                callAttempts: 0,
                schedulerStatus: "pending",
              },
            });
            touched.add(k.id);
          }
        }
      } else {
        const contact = await prisma.account.findUnique({
          where: { id: call.contactId },
          select: { name: true },
        });
        const adopt = pickHoldFor(due, opts.holds ?? []);
        const t = await prisma.task.create({
          data: {
            ...(adopt ? { googleEventId: adopt } : {}),
            title: `Appointment with ${contact?.name || "business"}`,
            description: call.outcomeSummary,
            status: "open",
            source: "agent",
            kind: "appointment",
            conversationId: call.conversationId,
            contactId: call.contactId,
            confidence: 1,
            dueDate: due,
            nextAttemptAt: firstFireAt("appointment", due, tz, now),
            callAttempts: 0,
            schedulerStatus: "pending",
            meta: sanitizeMeta("appointment", { ref: call.confirmationRef }) as any,
          },
        });
        appointmentId = t.id;
        touched.add(t.id);
        if (adopt) result.adoptedEventId = adopt;
      }
    }
  }

  // 3. followUps become tasks, children of the appointment when there is one
  for (const f of followUps.slice(0, 6)) {
    const kind = normalizeKind(f.kind);
    if (!["bring", "pay", "submit", "follow_up"].includes(kind)) continue;
    const parent = appointmentId ?? existing?.id ?? null;
    if (kind === "bring" && !parent) continue;
    const fDue = f.dueAt
      ? parseModelDueDate(f.dueAt, now, { allowDateOnly: allowsDateOnly(kind), tz })
      : kind === "bring" ? due : null;
    const dup = await prisma.task.findFirst({
      where: { contactId: call.contactId, kind, title: f.title, status: { in: ACTIVE } },
    });
    if (dup) continue;
    const created = await prisma.task.create({
      data: {
        title: f.title.slice(0, 200),
        description: f.details?.slice(0, 2000),
        kind,
        status: kind === "follow_up" ? "suggested" : "open",
        source: "agent",
        confidence: 0.95,
        conversationId: call.conversationId,
        contactId: call.contactId,
        parentTaskId: parent,
        dueDate: fDue,
        nextAttemptAt: firstFireAt(kind, fDue, tz, now),
        meta: /^\d{4}-\d{2}-\d{2}$/.test(f.dueAt ?? "") ? { allDay: true } : undefined,
        schedulerStatus: "pending",
      },
    });
    touched.add(created.id);
  }
}
