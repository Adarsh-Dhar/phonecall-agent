import { describe, it, expect } from 'vitest';
import {
  computeNextAttempt,
  isWithinAllowedWindow,
  validateBusinessHours,
  parseBusinessHours,
} from '../schedulerPolicy';

const IST = 'Asia/Kolkata';

describe('computeNextAttempt', () => {
  const now = new Date('2026-10-08T10:00:00Z');
  it('backs off 15 min, 1 h, 4 h, then caps at 8 h', () => {
    expect(computeNextAttempt(1, now).getTime() - now.getTime()).toBe(15 * 60_000);
    expect(computeNextAttempt(2, now).getTime() - now.getTime()).toBe(60 * 60_000);
    expect(computeNextAttempt(3, now).getTime() - now.getTime()).toBe(4 * 60 * 60_000);
    expect(computeNextAttempt(9, now).getTime() - now.getTime()).toBe(8 * 60 * 60_000);
  });
});

describe('quiet hours (owner timezone, wrap-around)', () => {
  it('defers 01:30 IST to 06:00 IST (00:30Z), independent of server timezone', () => {
    const now = new Date('2026-10-08T20:00:00Z'); // 01:30 IST on the 9th
    const r = isWithinAllowedWindow(now, IST, 22, 6, null);
    expect(r.allowed).toBe(false);
    expect(r.nextAllowedTime?.toISOString()).toBe('2026-10-09T00:30:00.000Z');
  });

  it('defers 23:10 IST to 06:00 IST the next morning', () => {
    const now = new Date('2026-10-08T17:40:00Z'); // 23:10 IST
    const r = isWithinAllowedWindow(now, IST, 22, 6, null);
    expect(r.allowed).toBe(false);
    expect(r.nextAllowedTime?.toISOString()).toBe('2026-10-09T00:30:00.000Z');
  });

  it('allows 12:00 IST', () => {
    const now = new Date('2026-10-08T06:30:00Z');
    expect(isWithinAllowedWindow(now, IST, 22, 6, null).allowed).toBe(true);
  });

  it('handles a same-day range (13-15)', () => {
    const now = new Date('2026-10-08T08:00:00Z'); // 13:30 IST
    const r = isWithinAllowedWindow(now, IST, 13, 15, null);
    expect(r.allowed).toBe(false);
    expect(r.nextAllowedTime?.toISOString()).toBe('2026-10-08T09:30:00.000Z'); // 15:00 IST
  });

  it('does not throw on an invalid timezone (falls back to UTC)', () => {
    expect(() => isWithinAllowedWindow(new Date(), 'Not/AZone', 22, 6, null)).not.toThrow();
  });
});

describe('business hours', () => {
  const bh = { days: [1, 2, 3, 4, 5], start: 9, end: 17, tz: IST };

  it('allows Thursday 11:30 IST', () => {
    expect(isWithinAllowedWindow(new Date('2026-10-08T06:00:00Z'), 'UTC', null, null, bh).allowed).toBe(true);
  });

  it('defers Saturday 10:30 IST to Monday 09:00 IST (03:30Z)', () => {
    const r = isWithinAllowedWindow(new Date('2026-10-10T05:00:00Z'), 'UTC', null, null, bh);
    expect(r.allowed).toBe(false);
    expect(r.nextAllowedTime?.toISOString()).toBe('2026-10-12T03:30:00.000Z');
  });

  it('defers Thursday 18:00 IST to Friday 09:00 IST', () => {
    const r = isWithinAllowedWindow(new Date('2026-10-08T12:30:00Z'), 'UTC', null, null, bh);
    expect(r.allowed).toBe(false);
    expect(r.nextAllowedTime?.toISOString()).toBe('2026-10-09T03:30:00.000Z');
  });

  it('respects both quiet hours and business hours together', () => {
    // 08:30 IST Thursday: business closed (opens at 9) and not quiet, so next is 09:00 IST
    const r = isWithinAllowedWindow(new Date('2026-10-08T03:00:00Z'), IST, 22, 6, bh);
    expect(r.nextAllowedTime?.toISOString()).toBe('2026-10-08T03:30:00.000Z');
  });
});

describe('validateBusinessHours / parseBusinessHours', () => {
  it('accepts a valid object and a valid JSON string', () => {
    expect(validateBusinessHours({ days: [1, 2], start: 9, end: 17, tz: IST })).toEqual({ days: [1, 2], start: 9, end: 17, tz: IST });
    expect(validateBusinessHours(JSON.stringify({ days: [5, 1], start: 9, end: 18 }))).toEqual({ days: [1, 5], start: 9, end: 18 });
  });

  it.each([
    [{ days: [], start: 9, end: 17 }],
    [{ days: [7], start: 9, end: 17 }],
    [{ days: [1], start: 17, end: 9 }],
    [{ days: [1], start: 9, end: 25 }],
    [{ days: [1], start: 9, end: 17, tz: 'Not/AZone' }],
    ['not json'],
    [null],
  ])('rejects %j', (bad) => {
    expect(() => validateBusinessHours(bad)).toThrow();
  });

  it('parseBusinessHours returns null for missing or corrupt data instead of throwing', () => {
    expect(parseBusinessHours(null)).toBeNull();
    expect(parseBusinessHours('{broken')).toBeNull();
  });
});
