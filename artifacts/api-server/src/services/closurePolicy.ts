/**
 * Closure policy: pure helpers for business closures (holidays, emergencies,
 * out-of-service periods). No database access, no dependence on server time zone.
 */

export const CLOSURE_KINDS = ['holiday', 'out_of_service', 'emergency'] as const;
export type ClosureKind = (typeof CLOSURE_KINDS)[number];

export const CLOSURE_LIMITS = {
  label: 80,
  message: 200,
  maxDurationDays: 366,
  maxAheadDays: 730,
  maxClosures: 100,
};

const DAY_MS = 24 * 60 * 60 * 1000;

export interface Closure {
  startsAt: Date;
  endsAt: Date | null; // null = until the business reopens
}

/** Returns the closure that covers instant d, or null. Prefers the one that lasts longest. */
export function activeClosure<T extends Closure>(closures: T[] | undefined | null, d: Date): T | null {
  if (!closures || closures.length === 0) return null;
  const t = d.getTime();
  let best: T | null = null;
  for (const c of closures) {
    if (c.startsAt.getTime() > t) continue;
    if (c.endsAt !== null && c.endsAt.getTime() <= t) continue;
    if (!best) {
      best = c;
    } else if (best.endsAt !== null && (c.endsAt === null || c.endsAt.getTime() > best.endsAt.getTime())) {
      best = c;
    }
  }
  return best;
}

function isValidTz(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Offset (local minus UTC, in ms) of tz at the given instant. */
function tzOffsetMs(date: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? '0');
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'));
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** true when s is a real calendar date written YYYY-MM-DD. */
export function isValidDateString(s: unknown): s is string {
  if (typeof s !== 'string') return false;
  const m = DATE_RE.exec(s);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

/** Adds days to a YYYY-MM-DD string (calendar arithmetic, no time zone involved). */
export function addDaysToDateString(s: string, days: number): string {
  const m = DATE_RE.exec(s)!;
  const dt = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + days));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

const LOCAL_RE = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/;

/** The UTC instant of a wall-clock time (YYYY-MM-DDTHH:mm) in tz, or null when it is not a real time. */
export function zonedLocalToUtc(local: string, tz: string): Date | null {
  const m = LOCAL_RE.exec(local);
  if (!m || !isValidDateString(m[1])) return null;
  const hour = Number(m[2]);
  const minute = Number(m[3]);
  if (hour > 23 || minute > 59) return null;
  const d = DATE_RE.exec(m[1])!;
  const guess = Date.UTC(Number(d[1]), Number(d[2]) - 1, Number(d[3]), hour, minute, 0);
  let utc = guess - tzOffsetMs(new Date(guess), tz);
  // Re-check the offset at the result, because it can differ across a DST change.
  utc = guess - tzOffsetMs(new Date(utc), tz);
  return new Date(utc);
}

/** The UTC instant of local midnight at the start of dateStr in tz. */
export function zonedMidnightUtc(dateStr: string, tz: string): Date {
  return zonedLocalToUtc(`${dateStr}T00:00`, tz) as Date;
}

export interface ClosureInput {
  kind?: unknown;
  label?: unknown;
  message?: unknown;
  allDay?: unknown;
  startDate?: unknown; // YYYY-MM-DD, when allDay
  endDate?: unknown; // YYYY-MM-DD inclusive, when allDay
  startsAt?: unknown; // ISO string, when not allDay (defaults to now for non-holiday kinds)
  endsAt?: unknown; // ISO string or null (null = until reopened)
  startLocal?: unknown; // YYYY-MM-DDTHH:mm in the business time zone (alternative to startsAt)
  endLocal?: unknown; // YYYY-MM-DDTHH:mm in the business time zone (alternative to endsAt)
  blockCalls?: unknown;
}

export type ClosureValue = {
  kind: ClosureKind;
  label: string | null;
  message: string | null;
  startsAt: Date;
  endsAt: Date | null;
  allDay: boolean;
  blockCalls: boolean;
};

export type ClosureValidation = { ok: true; value: ClosureValue } | { ok: false; error: string };

function parseIso(v: unknown): Date | null {
  if (typeof v !== 'string' || v.trim() === '') return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function validateClosureInput(
  input: ClosureInput,
  ctx: { timezone: string | null | undefined; now: Date },
): ClosureValidation {
  const kind = input.kind;
  if (typeof kind !== 'string' || !CLOSURE_KINDS.includes(kind as ClosureKind)) {
    return { ok: false, error: 'kind must be holiday, out_of_service or emergency' };
  }

  let label: string | null = null;
  if (input.label !== undefined && input.label !== null && input.label !== '') {
    if (typeof input.label !== 'string') return { ok: false, error: 'label must be text' };
    label = input.label.trim();
    if (label.length > CLOSURE_LIMITS.label) return { ok: false, error: `label must be at most ${CLOSURE_LIMITS.label} characters` };
  }

  let message: string | null = null;
  if (input.message !== undefined && input.message !== null && input.message !== '') {
    if (typeof input.message !== 'string') return { ok: false, error: 'message must be text' };
    message = input.message.replace(/[\r\n]+/g, ' ').trim();
    if (message.length > CLOSURE_LIMITS.message) return { ok: false, error: `message must be at most ${CLOSURE_LIMITS.message} characters` };
  }

  const allDay = input.allDay === true;
  const blockCalls = input.blockCalls === true;
  const openEnded = kind !== 'holiday';

  let startsAt: Date;
  let endsAt: Date | null;

  if (allDay) {
    const tz = ctx.timezone;
    if (!tz || !isValidTz(tz)) return { ok: false, error: 'Set your business timezone before adding an all-day closure' };
    if (!isValidDateString(input.startDate) || !isValidDateString(input.endDate)) {
      return { ok: false, error: 'startDate and endDate must be dates in the form YYYY-MM-DD' };
    }
    if (input.endDate < input.startDate) return { ok: false, error: 'endDate must not be before startDate' };
    startsAt = zonedMidnightUtc(input.startDate, tz);
    endsAt = zonedMidnightUtc(addDaysToDateString(input.endDate, 1), tz);
  } else {
    const tz = ctx.timezone && isValidTz(ctx.timezone) ? ctx.timezone : null;
    const hasStartLocal = typeof input.startLocal === 'string' && input.startLocal !== '';
    const hasEndLocal = typeof input.endLocal === 'string' && input.endLocal !== '';
    if ((hasStartLocal || hasEndLocal) && !tz) {
      return { ok: false, error: 'Set your business timezone before choosing local times' };
    }

    if (hasStartLocal) {
      const s = zonedLocalToUtc(input.startLocal as string, tz as string);
      if (!s) return { ok: false, error: 'startLocal must be a real date and time like 2026-11-03T14:30' };
      startsAt = s;
    } else if (input.startsAt === undefined || input.startsAt === null || input.startsAt === '') {
      if (kind === 'holiday') return { ok: false, error: 'A start date and time is required' };
      startsAt = ctx.now;
    } else {
      const s = parseIso(input.startsAt);
      if (!s) return { ok: false, error: 'startsAt must be a valid date and time' };
      startsAt = s;
    }

    if (hasEndLocal) {
      const e = zonedLocalToUtc(input.endLocal as string, tz as string);
      if (!e) return { ok: false, error: 'endLocal must be a real date and time like 2026-11-03T14:30' };
      endsAt = e;
    } else if (input.endsAt === undefined || input.endsAt === null || input.endsAt === '') {
      endsAt = null;
    } else {
      const e = parseIso(input.endsAt);
      if (!e) return { ok: false, error: 'endsAt must be a valid date and time' };
      endsAt = e;
    }
  }

  if (endsAt === null && !openEnded) {
    return { ok: false, error: 'A holiday needs an end. Use out of service for a closure with no end.' };
  }
  if (endsAt !== null) {
    if (endsAt.getTime() <= startsAt.getTime()) return { ok: false, error: 'The end must be after the start' };
    if (endsAt.getTime() - startsAt.getTime() > CLOSURE_LIMITS.maxDurationDays * DAY_MS) {
      return { ok: false, error: `A closure can be at most ${CLOSURE_LIMITS.maxDurationDays} days long` };
    }
  }
  if (startsAt.getTime() - ctx.now.getTime() > CLOSURE_LIMITS.maxAheadDays * DAY_MS) {
    return { ok: false, error: 'A closure can start at most 2 years from now' };
  }

  return { ok: true, value: { kind: kind as ClosureKind, label, message, startsAt, endsAt, allDay, blockCalls } };
}

/** Public shape sent to individuals and the business page. */
export function closureStatus(c: Closure, now: Date): 'active' | 'upcoming' | 'past' {
  if (c.startsAt.getTime() > now.getTime()) return 'upcoming';
  if (c.endsAt !== null && c.endsAt.getTime() <= now.getTime()) return 'past';
  return 'active';
}

/** Returns true when two closure ranges overlap in time. */
export function overlaps(a: Closure, b: Closure): boolean {
  const aStart = a.startsAt.getTime();
  const aEnd = a.endsAt?.getTime() ?? Infinity;
  const bStart = b.startsAt.getTime();
  const bEnd = b.endsAt?.getTime() ?? Infinity;
  return aStart < bEnd && bStart < aEnd;
}
