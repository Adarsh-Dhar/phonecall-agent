import { describe, it, expect } from 'vitest';
import {
  validateClosureInput,
  ClosureKind,
  CLOSURE_LIMITS,
  closureStatus,
  overlaps,
} from '../closurePolicy';

describe('closurePolicy', () => {
  describe('validateClosureInput', () => {
    it('accepts a valid holiday closure', () => {
      const result = validateClosureInput(
        {
          kind: 'holiday',
          label: 'Diwali',
          message: 'Closed for Diwali',
          allDay: true,
          startDate: '2026-10-11',
          endDate: '2026-10-12',
          blockCalls: false,
        },
        { timezone: 'UTC', now: new Date('2026-10-01T00:00:00Z') },
      );
      expect(result.ok).toBe(true);
    });

    it('accepts a valid time-bounded closure', () => {
      const result = validateClosureInput(
        {
          kind: 'out_of_service',
          label: 'Maintenance',
          allDay: false,
          startLocal: '2026-10-11T09:00',
          endLocal: '2026-10-11T17:00',
          blockCalls: true,
        },
        { timezone: 'UTC', now: new Date('2026-10-01T00:00:00Z') },
      );
      expect(result.ok).toBe(true);
    });

    it('rejects unknown kind', () => {
      const result = validateClosureInput(
        {
          kind: 'unknown' as ClosureKind,
          allDay: true,
          startDate: '2026-10-11',
          endDate: '2026-10-12',
          blockCalls: false,
        },
        { timezone: 'UTC', now: new Date('2026-10-01T00:00:00Z') },
      );
      expect(result.ok).toBe(false);
    });

    it('rejects missing all-day start/end', () => {
      const result = validateClosureInput(
        {
          kind: 'holiday',
          allDay: true,
          startDate: '',
          endDate: '2026-10-12',
          blockCalls: false,
        },
        { timezone: 'UTC', now: new Date('2026-10-01T00:00:00Z') },
      );
      expect(result.ok).toBe(false);
    });

    it('rejects missing time-bounded start/end', () => {
      const result = validateClosureInput(
        {
          kind: 'holiday',
          allDay: false,
          startLocal: '',
          endLocal: '2026-10-11T17:00',
          blockCalls: false,
        },
        { timezone: 'UTC', now: new Date('2026-10-01T00:00:00Z') },
      );
      expect(result.ok).toBe(false);
    });

    it('rejects end before start for all-day', () => {
      const result = validateClosureInput(
        {
          kind: 'holiday',
          allDay: true,
          startDate: '2026-10-12',
          endDate: '2026-10-11',
          blockCalls: false,
        },
        { timezone: 'UTC', now: new Date('2026-10-01T00:00:00Z') },
      );
      expect(result.ok).toBe(false);
    });

    it('rejects end before start for time-bounded', () => {
      const result = validateClosureInput(
        {
          kind: 'out_of_service',
          allDay: false,
          startLocal: '2026-10-11T17:00',
          endLocal: '2026-10-11T09:00',
          blockCalls: false,
        },
        { timezone: 'UTC', now: new Date('2026-10-01T00:00:00Z') },
      );
      expect(result.ok).toBe(false);
    });

    it('rejects excessive label length', () => {
      const result = validateClosureInput(
        {
          kind: 'holiday',
          label: 'x'.repeat(CLOSURE_LIMITS.label + 1),
          allDay: true,
          startDate: '2026-10-11',
          endDate: '2026-10-12',
          blockCalls: false,
        },
        { timezone: 'UTC', now: new Date('2026-10-01T00:00:00Z') },
      );
      expect(result.ok).toBe(false);
    });

    it('rejects excessive message length', () => {
      const result = validateClosureInput(
        {
          kind: 'holiday',
          message: 'x'.repeat(CLOSURE_LIMITS.message + 1),
          allDay: true,
          startDate: '2026-10-11',
          endDate: '2026-10-12',
          blockCalls: false,
        },
        { timezone: 'UTC', now: new Date('2026-10-01T00:00:00Z') },
      );
      expect(result.ok).toBe(false);
    });
  });

  describe('closureStatus', () => {
    const now = new Date('2026-10-11T12:00:00Z');

    it('classifies active closure (started, not ended)', () => {
      const result = closureStatus(
        {
          startsAt: new Date('2026-10-11T10:00:00Z'),
          endsAt: new Date('2026-10-11T14:00:00Z'),
        },
        now,
      );
      expect(result).toBe('active');
    });

    it('classifies active closure (started, no end)', () => {
      const result = closureStatus(
        {
          startsAt: new Date('2026-10-11T10:00:00Z'),
          endsAt: null,
        },
        now,
      );
      expect(result).toBe('active');
    });

    it('classifies upcoming closure (not started)', () => {
      const result = closureStatus(
        {
          startsAt: new Date('2026-10-12T10:00:00Z'),
          endsAt: new Date('2026-10-12T14:00:00Z'),
        },
        now,
      );
      expect(result).toBe('upcoming');
    });

    it('classifies past closure (ended)', () => {
      const result = closureStatus(
        {
          startsAt: new Date('2026-10-10T10:00:00Z'),
          endsAt: new Date('2026-10-10T14:00:00Z'),
        },
        now,
      );
      expect(result).toBe('past');
    });
  });

  describe('overlaps', () => {
    it('detects overlapping ranges', () => {
      const result = overlaps(
        { startsAt: new Date('2026-10-11T10:00:00Z'), endsAt: new Date('2026-10-11T14:00:00Z') },
        { startsAt: new Date('2026-10-11T12:00:00Z'), endsAt: new Date('2026-10-11T16:00:00Z') },
      );
      expect(result).toBe(true);
    });

    it('detects no overlap (before)', () => {
      const result = overlaps(
        { startsAt: new Date('2026-10-11T10:00:00Z'), endsAt: new Date('2026-10-11T12:00:00Z') },
        { startsAt: new Date('2026-10-11T14:00:00Z'), endsAt: new Date('2026-10-11T16:00:00Z') },
      );
      expect(result).toBe(false);
    });

    it('detects no overlap (after)', () => {
      const result = overlaps(
        { startsAt: new Date('2026-10-11T14:00:00Z'), endsAt: new Date('2026-10-11T16:00:00Z') },
        { startsAt: new Date('2026-10-11T10:00:00Z'), endsAt: new Date('2026-10-11T12:00:00Z') },
      );
      expect(result).toBe(false);
    });

    it('handles open-ended (null end) overlaps', () => {
      const result = overlaps(
        { startsAt: new Date('2026-10-11T10:00:00Z'), endsAt: null },
        { startsAt: new Date('2026-10-11T12:00:00Z'), endsAt: new Date('2026-10-11T14:00:00Z') },
      );
      expect(result).toBe(true);
    });

    it('handles null end with later start (no overlap)', () => {
      const result = overlaps(
        { startsAt: new Date('2026-10-11T10:00:00Z'), endsAt: new Date('2026-10-11T12:00:00Z') },
        { startsAt: new Date('2026-10-11T14:00:00Z'), endsAt: null },
      );
      expect(result).toBe(false);
    });
  });
});
