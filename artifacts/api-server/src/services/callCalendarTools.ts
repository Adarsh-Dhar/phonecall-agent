import { prisma } from "@workspace/db-prisma";
import { logger } from "../lib/logger";
import {
  APPOINTMENT_MINUTES,
  getBusyIntervals,
  insertHoldEvent,
  deleteCalendarEventById,
  listHoldEvents,
} from "./googleCalendar";
import { localAt } from "./taskKinds";
import type { SlotApproval } from "./approvalRules";

export interface Interval {
  start: Date;
  end: Date;
}

export const WORK_START_HOUR = 9;
export const WORK_END_HOUR = 18;
export const SLOT_STEP_MIN = 30;
export const SEARCH_DAYS = 7;
export const MAX_ALTERNATIVES = 3;
export const MAX_HOLDS_PER_CALL = 5;
const MIN_DURATION = 10;
const MAX_DURATION = 240;
const MIN_LEAD_MS = 30 * 60_000; // alternatives start at least 30 minutes from now

export const overlaps = (a: Interval, b: Interval) => a.start < b.end && b.start < a.end;

export function findConflict(slot: Interval, busy: Interval[]): Interval | null {
  return busy.find((b) => overlaps(slot, b)) ?? null;
}

export function isWithinWorkingHours(slot: Interval, tz: string): boolean {
  const dayStart = localAt(slot.start, tz, 0, WORK_START_HOUR);
  const dayEnd = localAt(slot.start, tz, 0, WORK_END_HOUR);
  return slot.start >= dayStart && slot.end <= dayEnd;
}

/**
 * Next free start times at or after `from`, on a 30-minute grid inside working hours
 * (owner-local), up to SEARCH_DAYS days ahead. Never returns a time in the past.
 */
export function suggestAlternatives(opts: {
  from: Date;
  durationMin: number;
  tz: string;
  busy: Interval[];
  now: Date;
  max?: number;
}): Date[] {
  const { from, durationMin, tz, busy, now } = opts;
  const max = opts.max ?? MAX_ALTERNATIVES;
  const stepMs = SLOT_STEP_MIN * 60_000;
  const durMs = durationMin * 60_000;
  const earliest = Math.max(+from, +now + MIN_LEAD_MS);
  const out: Date[] = [];

  for (let d = 0; d <= SEARCH_DAYS && out.length < max; d++) {
    const dayStart = localAt(from, tz, d, WORK_START_HOUR);
    const dayEnd = localAt(from, tz, d, WORK_END_HOUR);
    let t = Math.max(+dayStart, earliest);
    t = Math.ceil(t / stepMs) * stepMs; // align to the grid (UTC grid is fine for 30-min steps)
    for (; t + durMs <= +dayEnd && out.length < max; t += stepMs) {
      const slot = { start: new Date(t), end: new Date(t + durMs) };
      if (+slot.start === +from) continue; // the slot that just conflicted
      if (!findConflict(slot, busy)) out.push(slot.start);
    }
  }
  return out;
}

const OFFSET_RE = /(Z|[+-]\d{2}:?\d{2})$/i;

export type ParsedSlot =
  | { ok: true; start: Date; end: Date; durationMin: number }
  | { ok: false; error: "invalid_startsAt" | "time_in_past" };

/** startsAt must carry a UTC offset: a bare "2026-10-29T16:00" is ambiguous. */
export function parseSlotArgs(args: any, now: Date): ParsedSlot {
  const raw = typeof args?.startsAt === "string" ? args.startsAt.trim() : "";
  if (!raw || !OFFSET_RE.test(raw)) return { ok: false, error: "invalid_startsAt" };
  const start = new Date(raw);
  if (Number.isNaN(start.getTime())) return { ok: false, error: "invalid_startsAt" };
  if (+start <= +now) return { ok: false, error: "time_in_past" };
  const n = Number(args?.durationMin);
  const durationMin = Number.isFinite(n) && n > 0
    ? Math.min(MAX_DURATION, Math.max(MIN_DURATION, Math.round(n)))
    : APPOINTMENT_MINUTES;
  return { ok: true, start, end: new Date(+start + durationMin * 60_000), durationMin };
}

function safeTz(tz: string | null | undefined): string {
  const fallback = process.env.DEFAULT_TIMEZONE || "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz || fallback });
    return tz || fallback;
  } catch {
    return "UTC";
  }
}

/** "Thursday, 29 October, 4:30 PM" in the owner's zone, for the model to read aloud. */
export function spokenTime(d: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz, weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", hour12: true,
  }).format(d);
}

const ACTIVE = ["suggested", "open", "in_progress", "waiting_user"];

export interface CallHold {
  /** null when the owner has no calendar connected: the hold exists only in memory. */
  eventId: string | null;
  start: Date;
  end: Date;
  label: string;
}

export const CALENDAR_TOOL_NAMES = ["check_availability", "hold_slot"] as const;
export const isCalendarTool = (n: string): n is (typeof CALENDAR_TOOL_NAMES)[number] =>
  (CALENDAR_TOOL_NAMES as readonly string[]).includes(n);

export function createCallCalendarTools(ctx: {
  callId: string;
  ownerId: string;
  contactId: string;
  /** Agent-mode standing rules. Absent = no gating (tests, owner on the line). */
  approval?: SlotApproval;
}) {
  const holds: CallHold[] = [];
  const ownEventIds = () => holds.map((h) => h.eventId).filter((x): x is string => !!x);

  async function ownerTz(): Promise<string> {
    const a = await prisma.account.findUnique({ where: { id: ctx.ownerId }, select: { timezone: true } });
    return safeTz(a?.timezone);
  }

  /** Busy intervals from Google (minus this call's own holds) + the owner's open appointment tasks. */
  async function loadBusy(from: Date, to: Date): Promise<{ busy: Interval[]; calendarChecked: boolean }> {
    const own = new Set(ownEventIds());
    const google = await getBusyIntervals(ctx.ownerId, from.toISOString(), to.toISOString());
    const busy: Interval[] = (google ?? []).filter((b) => !own.has(b.eventId)).map((b) => ({ start: b.start, end: b.end }));

    // The contact on THIS call is excluded: rescheduling must not collide with the booking it replaces.
    const tasks = await prisma.task.findMany({
      where: {
        kind: "appointment",
        status: { in: ACTIVE },
        contactId: { not: ctx.contactId },
        contact: { ownerId: ctx.ownerId },
        dueDate: { gte: new Date(+from - APPOINTMENT_MINUTES * 60_000), lt: to },
      },
      select: { dueDate: true },
    });
    for (const t of tasks) {
      if (t.dueDate) busy.push({ start: t.dueDate, end: new Date(+t.dueDate + APPOINTMENT_MINUTES * 60_000) });
    }
    return { busy, calendarChecked: google !== null };
  }

  async function check(args: any, now = new Date()) {
    const p = parseSlotArgs(args, now);
    if (!p.ok) return { error: p.error, hint: "startsAt must be an ISO 8601 date-time with a UTC offset, in the future." };

    const tz = await ownerTz();
    const searchEnd = new Date(+p.start + (SEARCH_DAYS + 1) * 24 * 3600_000);
    const { busy, calendarChecked } = await loadBusy(new Date(+p.start - 3600_000), searchEnd);
    const slot = { start: p.start, end: p.end };
    const conflict = findConflict(slot, busy);

    if (!conflict) {
      // Free is not the same as allowed: tell the model now, so it does not offer a forbidden time.
      const verdict = ctx.approval?.decide(p.start, p.durationMin);
      return {
        free: true,
        calendarChecked,
        ...(isWithinWorkingHours(slot, tz) ? {} : { outsideUsualHours: true }),
        ...(verdict && verdict.decision !== "allow"
          ? { approval: verdict.decision, approvalReason: verdict.reason, instruction: verdict.instruction }
          : {}),
      };
    }
    // With rules, search wider and keep only the alternatives the rules would let the agent accept.
    const wanted = ctx.approval ? 12 : undefined;
    const raw = suggestAlternatives({ from: p.start, durationMin: p.durationMin, tz, busy, now, max: wanted });
    const alts = (ctx.approval ? raw.filter((d) => ctx.approval!.decide(d, p.durationMin).decision === "allow") : raw).slice(
      0,
      MAX_ALTERNATIVES,
    );
    return {
      free: false,
      calendarChecked,
      // Times only: never leak event titles to the business on the line.
      alternatives: alts.map((d) => ({ startsAt: d.toISOString(), spoken: spokenTime(d, tz) })),
    };
  }

  async function hold(args: any, now = new Date()) {
    const availability: any = await check(args, now);
    if (availability.error) return availability;
    if (!availability.free) return { held: false, ...availability };

    const p = parseSlotArgs(args, now) as Extract<ParsedSlot, { ok: true }>;

    // Hard gate: whatever the model was told, a slot the rules do not allow is never held.
    if (ctx.approval) {
      const verdict = ctx.approval.decide(p.start, p.durationMin);
      if (verdict.decision !== "allow") {
        ctx.approval.record(verdict, { startsAt: p.start.toISOString(), via: "hold_slot" });
        return {
          held: false,
          approval: verdict.decision,
          approvalReason: verdict.reason,
          instruction: verdict.instruction,
        };
      }
    }
    const existing = holds.find((h) => Math.abs(+h.start - +p.start) <= 60_000);
    if (existing) return { held: true, alreadyHeld: true, calendarChecked: availability.calendarChecked };

    const label = String(args?.label ?? "appointment").replace(/\s+/g, " ").trim().slice(0, 80) || "appointment";

    // Keep a few candidate holds (a clinic may offer several times), drop the oldest beyond that.
    while (holds.length >= MAX_HOLDS_PER_CALL) {
      const old = holds.shift()!;
      if (old.eventId) await deleteCalendarEventById(ctx.ownerId, old.eventId);
    }

    if (!availability.calendarChecked) {
      holds.push({ eventId: null, start: p.start, end: p.end, label });
      return { held: true, calendar: "not_connected", calendarChecked: false };
    }
    const eventId = await insertHoldEvent(ctx.ownerId, { label, start: p.start, end: p.end, callId: ctx.callId });
    if (!eventId) return { error: "calendar_unavailable" };
    holds.push({ eventId, start: p.start, end: p.end, label });
    return { held: true, calendarChecked: true };
  }

  return {
    /** Entry point used by the voice session. Never throws: any failure becomes calendar_unavailable. */
    async handle(name: string, args: unknown): Promise<unknown> {
      try {
        if (!ctx.ownerId) return { error: "calendar_unavailable" };
        if (name === "check_availability") return await check(args);
        if (name === "hold_slot") return await hold(args);
        return { error: "unknown tool" };
      } catch (err) {
        logger.error({ err, callId: ctx.callId, tool: name }, "callCalendarTools: tool failed");
        return { error: "calendar_unavailable" };
      }
    },

    /** Holds that exist as real calendar events (candidates for adoption at call end). */
    activeHolds(): Array<{ eventId: string; start: Date }> {
      return holds.filter((h) => h.eventId).map((h) => ({ eventId: h.eventId as string, start: h.start }));
    },

    /** Delete every hold from this call, except the one that became the appointment's event. */
    async releaseHolds(keepEventId?: string): Promise<number> {
      const toDelete = holds.splice(0).filter((h) => h.eventId && h.eventId !== keepEventId);
      let n = 0;
      for (const h of toDelete) {
        if (await deleteCalendarEventById(ctx.ownerId, h.eventId as string)) n++;
      }
      return n;
    },
  };
}

export type CallCalendarTools = ReturnType<typeof createCallCalendarTools>;

/** Pick the hold whose start matches the confirmed time (within a minute). Pure. */
export function pickHoldFor(
  confirmedAt: Date | null | undefined,
  holds: Array<{ eventId: string; start: Date }>,
  toleranceMs = 60_000,
): string | undefined {
  if (!confirmedAt) return undefined;
  return holds.find((h) => Math.abs(+h.start - +confirmedAt) <= toleranceMs)?.eventId;
}

export const HOLD_TTL_MS = (Number(process.env.CALENDAR_HOLD_TTL_MIN) || 120) * 60_000;
const SWEEP_EVERY_MS = 10 * 60_000;
const lastSweep = new Map<string, number>();

/** Deletes HOLD events older than HOLD_TTL (a call that died before cleanup). Never throws. */
export async function sweepStaleHolds(userId: string, now = new Date()): Promise<number> {
  if (now.getTime() - (lastSweep.get(userId) ?? 0) < SWEEP_EVERY_MS) return 0;
  lastSweep.set(userId, now.getTime());
  try {
    const holds = await listHoldEvents(userId);
    if (!holds) return 0;
    let n = 0;
    for (const h of holds) {
      if (h.created && +now - +h.created > HOLD_TTL_MS && (await deleteCalendarEventById(userId, h.id))) n++;
    }
    if (n) logger.info({ userId, deleted: n }, "callCalendarTools: swept stale holds");
    return n;
  } catch (err) {
    logger.error({ err, userId }, "callCalendarTools: hold sweep failed");
    return 0;
  }
}
