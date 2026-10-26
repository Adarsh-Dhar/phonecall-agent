import { describe, it, expect } from 'vitest';
import {
  decideAfterDecline,
  resolveDeclinePrefs,
  validateDeclinePrefs,
  DEFAULT_DECLINE_MAX_RETRIES,
  DEFAULT_DECLINE_RETRY_DELAY_MIN,
} from '../declinePolicy';

const NOW = new Date('2026-10-26T10:00:00.000Z');

describe('decideAfterDecline', () => {
  const prefs = { delayMin: 30, maxRetries: 2 };

  it('recalls after the chosen delay while recalls remain', () => {
    const d1 = decideAfterDecline(1, prefs, NOW);
    expect(d1).toEqual({ action: 'retry', nextAttemptAt: new Date('2026-10-26T10:30:00.000Z'), recallsLeft: 2 });
    const d2 = decideAfterDecline(2, prefs, NOW);
    expect(d2).toMatchObject({ action: 'retry', recallsLeft: 1 });
  });

  it('gives up (non-responsive) once rejections exceed the allowed recalls', () => {
    expect(decideAfterDecline(3, prefs, NOW)).toEqual({ action: 'give_up', declines: 3 });
  });

  it('maxRetries = 0 never recalls', () => {
    expect(decideAfterDecline(1, { delayMin: 30, maxRetries: 0 }, NOW)).toEqual({ action: 'give_up', declines: 1 });
  });

  it('uses the delay the owner picked', () => {
    const d = decideAfterDecline(1, { delayMin: 240, maxRetries: 1 }, NOW);
    expect(d).toMatchObject({ action: 'retry', nextAttemptAt: new Date('2026-10-26T14:00:00.000Z') });
  });
});

describe('validateDeclinePrefs', () => {
  it('accepts values in range', () => {
    expect(validateDeclinePrefs({ delayMin: 1, maxRetries: 0 })).toEqual({ delayMin: 1, maxRetries: 0 });
    expect(validateDeclinePrefs({ delayMin: 1440, maxRetries: 10 })).toEqual({ delayMin: 1440, maxRetries: 10 });
  });
  it.each([
    [{ delayMin: 0, maxRetries: 2 }],
    [{ delayMin: 1441, maxRetries: 2 }],
    [{ delayMin: 30.5, maxRetries: 2 }],
    [{ delayMin: '30', maxRetries: 2 }],
    [{ delayMin: 30, maxRetries: -1 }],
    [{ delayMin: 30, maxRetries: 11 }],
    [{}],
  ])('rejects %j', (input) => {
    expect(() => validateDeclinePrefs(input)).toThrow();
  });
});

describe('resolveDeclinePrefs', () => {
  it('falls back to defaults for missing or corrupt stored values', () => {
    const d = { delayMin: DEFAULT_DECLINE_RETRY_DELAY_MIN, maxRetries: DEFAULT_DECLINE_MAX_RETRIES };
    expect(resolveDeclinePrefs({})).toEqual(d);
    expect(resolveDeclinePrefs({ declineRetryDelayMin: -5, declineMaxRetries: 99 })).toEqual(d);
  });
  it('keeps valid stored values', () => {
    expect(resolveDeclinePrefs({ declineRetryDelayMin: 60, declineMaxRetries: 4 })).toEqual({ delayMin: 60, maxRetries: 4 });
  });
});
