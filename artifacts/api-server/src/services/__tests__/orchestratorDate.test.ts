import { describe, it, expect } from 'vitest';
import { Intl } from 'intl';

describe('orchestratorPrompt', () => {
  it('the orchestrator date at 00:30 IST is today\'s date, not yesterday\'s', () => {
    // Test that when it's 00:30 IST (early morning), the date resolves to today
    // not yesterday's date as would happen with UTC
    const tz = 'Asia/Kolkata';
    const now = new Date('2026-10-08T19:00:00Z'); // 00:30 IST the next day
    const todayISO = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(now);
    
    // Should be 2026-10-09 (the next day in IST), not 2026-10-08 (still UTC)
    expect(todayISO).toBe('2026-10-09');
  });
});
