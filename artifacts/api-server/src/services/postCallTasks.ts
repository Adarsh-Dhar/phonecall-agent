import { prisma } from "@workspace/db-prisma";
import { logger } from "../lib/logger";
import { firstFireAt, normalizeKind, allowsDateOnly, sanitizeMeta } from "./taskKinds";
import { parseModelDueDate } from "./taskExtraction/validate";

type FollowUp = { kind: string; title: string; dueAt?: string; details?: string };
const ACTIVE = ["suggested", "open", "in_progress", "waiting_user"];

export async function applyPostCallTasks(callId: string, followUps: FollowUp[] = []) {
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
    await prisma.task.updateMany({
      where: { OR: [{ id: existing.id }, { parentTaskId: existing.id }], status: { in: ACTIVE } },
      data: { status: "cancelled", schedulerStatus: "done" },
    });
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
        meta: sanitizeMeta("appointment", { ref: call.confirmationRef }),
      };
      if (call.outcome === "rescheduled" && existing) {
        const delta = +due - +(existing.dueDate ?? due);
        const t = await prisma.task.update({ where: { id: existing.id }, data });
        appointmentId = t.id;
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
          }
        }
      } else {
        const contact = await prisma.account.findUnique({
          where: { id: call.contactId },
          select: { name: true },
        });
        const t = await prisma.task.create({
          data: {
            title: `Appointment with ${contact?.name || "business"}`,
            description: call.outcomeSummary,
            status: "open",
            source: "agent",
            kind: "appointment",
            conversationId: call.conversationId,
            contactId: call.contactId,
            confidence: 1,
            ...data,
          },
        });
        appointmentId = t.id;
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
    await prisma.task.create({
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
  }
}
