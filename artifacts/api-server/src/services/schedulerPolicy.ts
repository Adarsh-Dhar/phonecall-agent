/**
 * Scheduler Policy: pure functions for scheduling logic (no DB, no server-timezone dependence).
 * - Exponential backoff for retries
 * - Allowed window: owner quiet hours + contact business hours + business closures
 * - Business-hours validation
 */

import { activeClosure, type Closure } from './closurePolicy';

export const MAX_ATTEMPTS = Number(process.env.SCHEDULER_MAX_ATTEMPTS) || 3;

/** days: 0 = Sunday to 6 = Saturday. start: 0-23. end: 1-24 (exclusive). tz: IANA zone of the business. */
export interface BusinessHours {
  days: number[];
  start: number;
  end: number;
  tz?: string;
}

export const DEFAULT_BUSINESS_HOURS: BusinessHours = { days: [1, 2, 3, 4, 5], start: 9, end: 17 };
export type HoursSource = 'override' | 'business' | 'default';

export function resolveEffectiveHours(o: {
  contactJson?: string | null;   // the individual's override on the contact
  businessJson?: string | null;  // the business account's own hours
  businessTz?: string | null;
  contactTz?: string | null;
  ownerTz: string;
}): { hours: BusinessHours; source: HoursSource } {
  const override = parseBusinessHours(o.contactJson);
  const business = parseBusinessHours(o.businessJson);
  const base = override ?? business ?? DEFAULT_BUSINESS_HOURS;
  const source: HoursSource = override ? 'override' : business ? 'business' : 'default';
  const tz = base.tz ?? o.businessTz ?? o.contactTz ?? o.ownerTz;
  return { hours: { ...base, tz }, source };
}

const STEP_MS = 15 * 60 * 1000; // every real UTC offset is a multiple of 15 min
const MAX_SEARCH_STEPS = 8 * 24 * 4; // look up to 8 days ahead
export const OPEN_ENDED_RECHECK_MS = 60 * 60 * 1000; // re-check an open-ended closure every hour
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Backoff: attempts is 1-indexed. 1 = 15 min, 2 = 1 h, 3 = 4 h, 4+ = 8 h.
export function computeNextAttempt(attempts: number, now: Date): Date {
  return new Date(now.getTime() + getBackoffMs(attempts));
}

/**
 * Retry cadence when the AGENT dials the business itself (callScheduler → agentPlaceCall).
 * A business that was offline or didn't pick up at the scheduled minute should be retried soon,
 * not 15 minutes later: attempt 1 → +2 min, attempt 2 → +10 min, then the normal backoff.
 * Override the first gap with AUTO_DIAL_RETRY_MS.
 */
export function computeAutoDialRetry(attempts: number, now: Date): Date {
  const first = Number(process.env.AUTO_DIAL_RETRY_MS) || 2 * 60 * 1000;
  if (attempts <= 1) return new Date(now.getTime() + first);
  if (attempts === 2) return new Date(now.getTime() + 5 * first);
  return computeNextAttempt(attempts, now);
}

function getBackoffMs(attempts: number): number {
  const schedule = [15 * 60 * 1000, 60 * 60 * 1000, 4 * 60 * 60 * 1000];
  if (attempts <= 0) return schedule[0];
  if (attempts - 1 < schedule.length) return schedule[attempts - 1];
  return 8 * 60 * 60 * 1000;
}

// Time helpers: always computed from Intl, never from the server's local time.
function resolveTz(tz: string | null | undefined): string {
  if (!tz) return 'UTC';
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return tz;
  } catch {
    return 'UTC';
  }
}

function localParts(date: Date, tz: string): { weekday: number; hour: number; minute: number } {
  // Validate date before formatting
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date value: ${date.toString()}`);
  }
  // Validate timezone before formatting
  const resolvedTz = resolveTz(tz);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: resolvedTz,
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return {
    weekday: WEEKDAYS.indexOf(get('weekday')),
    hour: Number(get('hour')) % 24,
    minute: Number(get('minute')),
  };
}

/** Handles wrap-around ranges such as 22 to 6. */
function isHourInRange(hour: number, start: number, end: number): boolean {
  if (start <= end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}

function isBusinessOpen(date: Date, bh: BusinessHours, tz: string): boolean {
  const { weekday, hour } = localParts(date, tz);
  return bh.days.includes(weekday) && isHourInRange(hour, bh.start, bh.end);
}

/**
 * Is it OK to trigger a call right now?
 * - quietStart/quietEnd: the OWNER's quiet hours, evaluated in ownerTz.
 * - businessHours: the CONTACT's opening hours, evaluated in businessHours.tz (falls back to ownerTz).
 * - closures: the business's holidays / out-of-service periods; calls are never allowed inside one.
 * If not allowed, nextAllowedTime is the first 15-minute boundary where every check passes.
 */
export function isWithinAllowedWindow(
  now: Date,
  ownerTz: string,
  quietStart: number | null,
  quietEnd: number | null,
  businessHours: BusinessHours | null,
  closures: Closure[] = [],
): { allowed: boolean; nextAllowedTime?: Date } {
  const tz = resolveTz(ownerTz);
  const bhTz = resolveTz(businessHours?.tz ?? ownerTz);
  const hasQuiet = quietStart !== null && quietEnd !== null;

  const blocked = (d: Date): boolean => {
    if (hasQuiet && isHourInRange(localParts(d, tz).hour, quietStart as number, quietEnd as number)) return true;
    if (businessHours && !isBusinessOpen(d, businessHours, bhTz)) return true;
    if (activeClosure(closures, d)) return true;
    return false;
  };

  if (!blocked(now)) return { allowed: true };

  // An open-ended closure ("out of service until further notice") has no known end:
  // re-check soon so a reopen takes effect quickly instead of waiting a day.
  const nowClosure = activeClosure(closures, now);
  if (nowClosure && nowClosure.endsAt === null) {
    return { allowed: false, nextAllowedTime: new Date(now.getTime() + OPEN_ENDED_RECHECK_MS) };
  }

  let t = Math.floor(now.getTime() / STEP_MS) * STEP_MS;
  for (let i = 0; i < MAX_SEARCH_STEPS; i++) {
    t += STEP_MS;
    const candidate = new Date(t);
    if (!blocked(candidate)) return { allowed: false, nextAllowedTime: candidate };
    // Inside a closure that has an end: jump straight to the first step at or after it.
    const closure = activeClosure(closures, candidate);
    if (closure && closure.endsAt) {
      const endStep = Math.ceil(closure.endsAt.getTime() / STEP_MS) * STEP_MS;
      if (endStep - STEP_MS > t) t = endStep - STEP_MS;
    }
  }
  // Nothing found within 8 days (for example an empty schedule): try again tomorrow.
  return { allowed: false, nextAllowedTime: new Date(now.getTime() + 24 * 60 * 60 * 1000) };
}

/** Throws Error(message) when invalid. Accepts an object or a JSON string. */
export function validateBusinessHours(raw: unknown): BusinessHours {
  let value: any = raw;
  if (typeof raw === 'string') {
    try {
      value = JSON.parse(raw);
    } catch {
      throw new Error('businessHours must be valid JSON');
    }
  }
  if (!value || typeof value !== 'object') throw new Error('businessHours must be an object');

  const { days, start, end, tz } = value;
  if (!Array.isArray(days) || days.length === 0 || !days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)) {
    throw new Error('days must be a non-empty array of integers 0 (Sun) to 6 (Sat)');
  }
  if (!Number.isInteger(start) || start < 0 || start > 23) throw new Error('start must be an integer 0-23');
  if (!Number.isInteger(end) || end < 1 || end > 24) throw new Error('end must be an integer 1-24');
  if (start >= end) throw new Error('end must be greater than start (use end < start for next-day end)');

  const result: BusinessHours = { days: Array.from(new Set<number>(days)).sort(), start, end };
  if (tz !== undefined && tz !== null) {
    if (typeof tz !== 'string') throw new Error('tz must be a string');
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: tz });
    } catch {
      throw new Error('tz is not a valid IANA timezone');
    }
    result.tz = tz;
  }
  return result;
}

/** Safe parse for stored data: returns null (instead of throwing) when missing or corrupt. */
export function parseBusinessHours(json: string | null | undefined): BusinessHours | null {
  if (!json) return null;
  try {
    return validateBusinessHours(json);
  } catch {
    return null;
  }
}
