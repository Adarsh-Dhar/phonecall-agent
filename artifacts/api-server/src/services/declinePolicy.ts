/**
 * Decline policy: pure functions (no DB) for "the business rejected the agent's call".
 *
 * The individual picks two things in Preferences:
 *   - declineRetryDelayMin: how long the agent waits before calling again after a rejection
 *   - declineMaxRetries:    how many RECALLS it makes after the first rejection (0 = never recall)
 * Once the business has rejected more calls than the allowed recalls, the agent stops and the
 * owner is told the business is non-responsive.
 *
 * Example: declineMaxRetries = 2 → first call + 2 recalls = 3 rejections, then "non-responsive".
 */

export const DEFAULT_DECLINE_RETRY_DELAY_MIN = 30;
export const DEFAULT_DECLINE_MAX_RETRIES = 2;
export const MIN_DECLINE_RETRY_DELAY_MIN = 1;
export const MAX_DECLINE_RETRY_DELAY_MIN = 24 * 60;
export const MAX_DECLINE_MAX_RETRIES = 10;

export interface DeclinePrefs {
  delayMin: number;
  maxRetries: number;
}

export type DeclineDecision =
  | { action: "retry"; nextAttemptAt: Date; recallsLeft: number }
  | { action: "give_up"; declines: number };

const isInt = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v);

/** Throws Error(message) when invalid. Used by the PATCH route. */
export function validateDeclinePrefs(raw: { delayMin?: unknown; maxRetries?: unknown }): DeclinePrefs {
  const { delayMin, maxRetries } = raw;
  if (!isInt(delayMin) || delayMin < MIN_DECLINE_RETRY_DELAY_MIN || delayMin > MAX_DECLINE_RETRY_DELAY_MIN) {
    throw new Error(`delayMin must be an integer from ${MIN_DECLINE_RETRY_DELAY_MIN} to ${MAX_DECLINE_RETRY_DELAY_MIN} (minutes)`);
  }
  if (!isInt(maxRetries) || maxRetries < 0 || maxRetries > MAX_DECLINE_MAX_RETRIES) {
    throw new Error(`maxRetries must be an integer from 0 to ${MAX_DECLINE_MAX_RETRIES}`);
  }
  return { delayMin, maxRetries };
}

/** Safe read of stored values: falls back to defaults instead of throwing. */
export function resolveDeclinePrefs(stored: { declineRetryDelayMin?: number | null; declineMaxRetries?: number | null }): DeclinePrefs {
  const delay = stored.declineRetryDelayMin;
  const max = stored.declineMaxRetries;
  return {
    delayMin:
      isInt(delay) && delay >= MIN_DECLINE_RETRY_DELAY_MIN && delay <= MAX_DECLINE_RETRY_DELAY_MIN
        ? delay
        : DEFAULT_DECLINE_RETRY_DELAY_MIN,
    maxRetries: isInt(max) && max >= 0 && max <= MAX_DECLINE_MAX_RETRIES ? max : DEFAULT_DECLINE_MAX_RETRIES,
  };
}

/**
 * @param declines how many calls for this task the business has rejected, INCLUDING the one that
 *                 just happened (so the first rejection is 1).
 */
export function decideAfterDecline(declines: number, prefs: DeclinePrefs, now = new Date()): DeclineDecision {
  // Stop retrying when declines exceeds maxRetries
  // Example: maxRetries = 5 → first call + 5 recalls = 6 total, then stop
  if (declines >= prefs.maxRetries + 1) return { action: "give_up", declines };
  return {
    action: "retry",
    nextAttemptAt: new Date(now.getTime() + prefs.delayMin * 60_000),
    recallsLeft: prefs.maxRetries - declines + 1,
  };
}
