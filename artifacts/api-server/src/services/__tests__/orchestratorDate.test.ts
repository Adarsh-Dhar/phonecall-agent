import { describe, it, expect, afterEach } from 'vitest';
import { resolveTodayISO } from '../taskExtraction/orchestratorPrompt';

describe('orchestrator date (real app function)', () => {
  afterEach(() => {
    delete process.env.DEFAULT_TIMEZONE;
  });

  it('at 00:30 IST the date is the IST day, not the UTC day', () => {
    const now = new Date('2026-10-08T19:00:00Z'); // 00:30 IST on the 9th
    expect(resolveTodayISO('Asia/Kolkata', now)).toBe('2026-10-09');
  });

  it('falls back to DEFAULT_TIMEZONE when the zone is invalid', () => {
    process.env.DEFAULT_TIMEZONE = 'Asia/Kolkata';
    const now = new Date('2026-10-08T19:00:00Z');
    expect(resolveTodayISO('Not/AZone', now)).toBe('2026-10-09');
  });
});
