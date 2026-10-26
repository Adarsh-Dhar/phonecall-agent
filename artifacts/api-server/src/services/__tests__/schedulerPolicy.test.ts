import { describe, it, expect } from 'vitest';
import {
  computeNextAttempt,
  isWithinAllowedWindow,
  validateBusinessHours,
  parseBusinessHours,
  resolveEffectiveHours,
  DEFAULT_BUSINESS_HOURS,
  type HoursSource,
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

  it('accepts overnight hours (9 to 8 means 9am to 8am next day)', () => {
    const overnightBh = { days: [1, 2, 3, 4, 5], start: 9, end: 8, tz: IST };
    expect(validateBusinessHours(overnightBh)).toEqual(overnightBh);
  });

  it('allows call at 23:00 IST with overnight hours (9 to 8)', () => {
    const overnightBh = { days: [1, 2, 3, 4, 5], start: 9, end: 8, tz: IST };
    // Monday 23:00 IST is within 9am-8am range (crosses midnight)
    expect(isWithinAllowedWindow(new Date('2026-10-12T17:30:00Z'), 'UTC', null, null, overnightBh).allowed).toBe(true);
  });

  it('allows call at 02:00 IST with overnight hours (9 to 8)', () => {
    const overnightBh = { days: [1, 2, 3, 4, 5], start: 9, end: 8, tz: IST };
    // Tuesday 02:00 IST is within 9am-8am range (crosses midnight)
    expect(isWithinAllowedWindow(new Date('2026-10-12T20:30:00Z'), 'UTC', null, null, overnightBh).allowed).toBe(true);
  });

  it('blocks call at 08:30 IST with overnight hours (9 to 8)', () => {
    const overnightBh = { days: [1, 2, 3, 4, 5], start: 9, end: 8, tz: IST };
    // Tuesday 08:30 IST is outside 9am-8am range (end is exclusive)
    const r = isWithinAllowedWindow(new Date('2026-10-12T03:15:00Z'), 'UTC', null, null, overnightBh);
    expect(r.allowed).toBe(false);
    expect(r.nextAllowedTime?.toISOString()).toBe('2026-10-12T03:30:00.000Z'); // 09:00 IST
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
    [{ days: [1], start: 9, end: 9 }],
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

describe('resolveEffectiveHours', () => {
  const IST = 'Asia/Kolkata';
  const PST = 'America/Los_Angeles';

  it('returns default when nothing is set', () => {
    const r = resolveEffectiveHours({
      contactJson: null,
      businessJson: null,
      businessTz: null,
      contactTz: null,
      ownerTz: IST,
    });
    expect(r.hours.days).toEqual(DEFAULT_BUSINESS_HOURS.days);
    expect(r.hours.start).toEqual(DEFAULT_BUSINESS_HOURS.start);
    expect(r.hours.end).toEqual(DEFAULT_BUSINESS_HOURS.end);
    expect(r.source).toBe<HoursSource>('default');
    expect(r.hours.tz).toBe(IST);
  });

  it('returns business hours when set, no override', () => {
    const businessHours = { days: [1, 2, 3, 4, 5], start: 10, end: 18, tz: PST };
    const r = resolveEffectiveHours({
      contactJson: null,
      businessJson: JSON.stringify(businessHours),
      businessTz: PST,
      contactTz: null,
      ownerTz: IST,
    });
    expect(r.hours).toEqual(businessHours);
    expect(r.source).toBe<HoursSource>('business');
    expect(r.hours.tz).toBe(PST);
  });

  it('returns override when set, takes precedence over business', () => {
    const overrideHours = { days: [1, 2, 3], start: 8, end: 12, tz: IST };
    const businessHours = { days: [1, 2, 3, 4, 5], start: 10, end: 18, tz: PST };
    const r = resolveEffectiveHours({
      contactJson: JSON.stringify(overrideHours),
      businessJson: JSON.stringify(businessHours),
      businessTz: PST,
      contactTz: null,
      ownerTz: IST,
    });
    expect(r.hours).toEqual(overrideHours);
    expect(r.source).toBe<HoursSource>('override');
    expect(r.hours.tz).toBe(IST);
  });

  it('uses hours timezone first, then business timezone, then contact timezone, then owner timezone', () => {
    const hoursWithTz = { days: [1, 2, 3], start: 9, end: 17, tz: 'UTC' };
    const r1 = resolveEffectiveHours({
      contactJson: JSON.stringify(hoursWithTz),
      businessJson: null,
      businessTz: PST,
      contactTz: IST,
      ownerTz: 'Asia/Tokyo',
    });
    expect(r1.hours.tz).toBe('UTC');

    const hoursWithoutTz = { days: [1, 2, 3], start: 9, end: 17 };
    const r2 = resolveEffectiveHours({
      contactJson: JSON.stringify(hoursWithoutTz),
      businessJson: null,
      businessTz: PST,
      contactTz: IST,
      ownerTz: 'Asia/Tokyo',
    });
    expect(r2.hours.tz).toBe(PST);

    const r3 = resolveEffectiveHours({
      contactJson: JSON.stringify(hoursWithoutTz),
      businessJson: null,
      businessTz: null,
      contactTz: IST,
      ownerTz: 'Asia/Tokyo',
    });
    expect(r3.hours.tz).toBe(IST);

    const r4 = resolveEffectiveHours({
      contactJson: JSON.stringify(hoursWithoutTz),
      businessJson: null,
      businessTz: null,
      contactTz: null,
      ownerTz: 'Asia/Tokyo',
    });
    expect(r4.hours.tz).toBe('Asia/Tokyo');
  });

  it('DEFAULT_BUSINESS_HOURS is Mon-Fri 9-17', () => {
    expect(DEFAULT_BUSINESS_HOURS).toEqual({
      days: [1, 2, 3, 4, 5],
      start: 9,
      end: 17,
    });
  });
});
