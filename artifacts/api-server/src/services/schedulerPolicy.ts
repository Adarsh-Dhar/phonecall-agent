/**
 * Scheduler Policy — pure functions for scheduling logic.
 *
 * This module contains the core scheduling algorithms that are easy to unit test:
 * - Exponential backoff for retry attempts
 * - Time window validation (quiet hours, business hours)
 * - Max attempts configuration
 */

export const MAX_ATTEMPTS = Number(process.env.SCHEDULER_MAX_ATTEMPTS) || 3;

/**
 * Computes the next attempt time using exponential backoff.
 *
 * Backoff schedule:
 * - Attempt 1 → 15 minutes
 * - Attempt 2 → 1 hour
 * - Attempt 3 → 4 hours
 * - Attempt 4+ → 8 hours (cap)
 *
 * @param attempts - Current attempt count (1-indexed)
 * @param now - Current timestamp
 * @returns Next attempt timestamp
 */
export function computeNextAttempt(attempts: number, now: Date): Date {
  const backoffMs = getBackoffMs(attempts);
  return new Date(now.getTime() + backoffMs);
}

/**
 * Returns the backoff duration in milliseconds for a given attempt count.
 */
function getBackoffMs(attempts: number): number {
  const backoffSchedule = [
    15 * 60 * 1000, // 15 minutes
    60 * 60 * 1000, // 1 hour
    4 * 60 * 60 * 1000, // 4 hours
  ];

  if (attempts <= 0) return backoffSchedule[0];
  if (attempts - 1 < backoffSchedule.length) {
    return backoffSchedule[attempts - 1];
  }
  // Cap at 8 hours for attempts beyond the schedule
  return 8 * 60 * 60 * 1000;
}

/**
 * Checks if the current time is within the allowed calling window.
 *
 * Respects:
 * - Owner's quiet hours (if set)
 * - Contact's business hours (if set as a service account)
 *
 * @param now - Current timestamp
 * @param ownerTz - Owner's timezone (e.g., "Asia/Kolkata")
 * @param quietStart - Owner's quiet hours start (0-23)
 * @param quietEnd - Owner's quiet hours end (0-23)
 * @param businessHours - Contact's business hours JSON (optional)
 * @returns Object with allowed flag and next allowed time if not allowed
 */
export function isWithinAllowedWindow(
  now: Date,
  ownerTz: string,
  quietStart: number | null,
  quietEnd: number | null,
  businessHours: any | null
): { allowed: boolean; nextAllowedTime?: Date } {
  // Get current hour in owner's timezone
  const ownerHour = getHourInTimezone(now, ownerTz);

  // Check quiet hours (owner's personal quiet time)
  if (quietStart !== null && quietEnd !== null) {
    if (isHourInRange(ownerHour, quietStart, quietEnd)) {
      // In quiet hours - find next time outside quiet hours
      const nextAllowed = findNextTimeOutsideQuietHours(now, ownerTz, quietStart, quietEnd);
      return { allowed: false, nextAllowedTime: nextAllowed };
    }
  }

  // Check business hours (contact's availability)
  if (businessHours) {
    // Parse business hours JSON and check
    // For now, this is a placeholder - implement based on your business hours schema
    // Example: { "days": [1,2,3,4,5], "start": 9, "end": 17 }
    const isWithinBusinessHours = checkBusinessHours(now, ownerTz, businessHours);
    if (!isWithinBusinessHours) {
      const nextAllowed = findNextBusinessHoursOpen(now, ownerTz, businessHours);
      return { allowed: false, nextAllowedTime: nextAllowed };
    }
  }

  return { allowed: true };
}

/**
 * Gets the hour (0-23) of a date in a specific timezone.
 * Uses hourCycle: 'h23' to ensure 0-23 range (24 at midnight becomes 0).
 */
function getHourInTimezone(date: Date, timezone: string): number {
  return parseInt(
    date.toLocaleString("en-US", { timeZone: timezone, hour12: false, hour: "numeric", hourCycle: "h23" })
  );
}

/**
 * Checks if an hour is within a range, handling wrap-around (e.g., 22:00 to 06:00).
 */
function isHourInRange(hour: number, start: number, end: number): boolean {
  if (start <= end) {
    // Normal range (e.g., 9:00 to 17:00)
    return hour >= start && hour < end;
  } else {
    // Wrap-around range (e.g., 22:00 to 06:00)
    return hour >= start || hour < end;
  }
}

/**
 * Finds the next time outside quiet hours.
 * Computes the next boundary in the owner's timezone using formatter parts.
 */
function findNextTimeOutsideQuietHours(
  now: Date,
  timezone: string,
  quietStart: number,
  quietEnd: number
): Date {
  const ownerHour = getHourInTimezone(now, timezone);
  const nextHour = findNextHourOutsideRange(ownerHour, quietStart, quietEnd);

  // Get date parts in owner's timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    hour12: false,
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(now);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value;

  let year = Number(getPart("year"));
  let month = Number(getPart("month")) - 1; // JS months are 0-indexed
  let day = Number(getPart("day"));

  // If next hour is in the future today, use it
  if (nextHour > ownerHour) {
    return new Date(year, month, day, nextHour, 0, 0);
  }

  // Otherwise, next allowed time is tomorrow at quietEnd
  // Add one day
  const tomorrow = new Date(year, month, day + 1, quietEnd, 0, 0);
  return tomorrow;
}

/**
 * Finds the next hour outside a range.
 */
function findNextHourOutsideRange(currentHour: number, start: number, end: number): number {
  if (start <= end) {
    // Normal range
    if (currentHour < start) return start;
    if (currentHour >= end) return currentHour + 1;
    return end;
  } else {
    // Wrap-around range
    if (currentHour >= start || currentHour < end) {
      // Currently in quiet hours
      return end;
    }
    return currentHour + 1;
  }
}

/**
 * Checks if current time is within business hours.
 * Placeholder implementation - extend based on your business hours schema.
 */
function checkBusinessHours(now: Date, timezone: string, businessHours: any): boolean {
  // TODO: Implement based on your business hours JSON schema
  // Example: { "days": [1,2,3,4,5], "start": 9, "end": 17 }
  // For now, always return true (no restriction)
  return true;
}

/**
 * Finds the next time business hours are open.
 * Placeholder implementation - returns 1 hour from now.
 * TODO: Implement based on your business hours JSON schema.
 */
function findNextBusinessHoursOpen(now: Date, timezone: string, businessHours: any): Date {
  // For now, return 1 hour from now
  return new Date(now.getTime() + 60 * 60 * 1000);
}

/**
 * Parses and validates business hours JSON.
 * Returns null if parsing fails or the format is invalid.
 */
export function parseBusinessHours(json: string | null): any | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    // Basic validation
    if (!parsed || typeof parsed !== 'object') return null;
    if (!Array.isArray(parsed.days)) return null;
    if (typeof parsed.start !== 'number' || parsed.start < 0 || parsed.start > 23) return null;
    if (typeof parsed.end !== 'number' || parsed.end < 0 || parsed.end > 24) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Validates business hours and throws an error if invalid.
 * Returns the validated object.
 */
export function validateBusinessHours(value: any): any {
  if (!value || typeof value !== 'object') {
    throw new Error('Business hours must be an object');
  }
  if (!Array.isArray(value.days)) {
    throw new Error('Business hours must have a "days" array');
  }
  if (value.days.some((d: number) => d < 0 || d > 6)) {
    throw new Error('Days must be numbers 0-6 (0=Sunday, 6=Saturday)');
  }
  if (typeof value.start !== 'number' || value.start < 0 || value.start > 23) {
    throw new Error('Start hour must be a number 0-23');
  }
  if (typeof value.end !== 'number' || value.end < 0 || value.end > 24) {
    throw new Error('End hour must be a number 0-24');
  }
  if (value.start >= value.end) {
    throw new Error('Start hour must be less than end hour');
  }
  return value;
}
