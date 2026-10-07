import { describe, it, expect } from 'vitest';
import { buildCallTimeContext } from '../callAnalysis';

describe('callAnalysis', () => {
  it('buildCallTimeContext gives the right date for a fixed now in Asia/Kolkata', () => {
    const fixedNow = new Date('2026-10-08T10:30:00Z'); // 4:00 PM IST
    const context = buildCallTimeContext('Asia/Kolkata', fixedNow);
    
    expect(context).toContain('Thursday, 2026-10-08');
    expect(context).toContain('4:00 PM');
    expect(context).toContain('(India Standard Time)');
  });

  it('buildCallTimeContext handles different timezones', () => {
    const fixedNow = new Date('2026-10-08T10:30:00Z');
    const context = buildCallTimeContext('America/New_York', fixedNow);
    
    expect(context).toContain('6:30 AM');
    expect(context).toContain('(Eastern Daylight Time)');
  });
});
