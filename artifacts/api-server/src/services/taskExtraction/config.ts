// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

/** Milliseconds of silence before extraction fires. */
export const DEBOUNCE_MS = parseInt(process.env.EXTRACTION_DEBOUNCE_MS ?? "5000", 10);

/** If this many new messages pile up before the timer fires, run immediately. */
export const HARD_CAP_MESSAGES = 6;

/**
 * Extractions with model confidence below this land as "suggested" rather than
 * jumping straight to "open". Configurable via env.
 */
export const CONFIDENCE_THRESHOLD = parseFloat(
  process.env.TASK_CONFIDENCE_THRESHOLD ?? "0.85"
);
