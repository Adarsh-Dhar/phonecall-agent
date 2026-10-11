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

/**
 * complete / cancel / due-date changes to an EXISTING task are applied only at
 * or above this confidence. Below it they are skipped and reported (see
 * ExtractionResult.skipped). Higher than CONFIDENCE_THRESHOLD because a wrong
 * one silently destroys or reschedules something the user already had.
 */
export const ACTION_CONFIDENCE_THRESHOLD = parseFloat(
  process.env.TASK_ACTION_CONFIDENCE_THRESHOLD ?? "0.9"
);

/**
 * Knowledge facts at or above this confidence become "active" (used on live
 * calls). Below it they are stored as "suggested" and ignored until a person
 * approves them (PATCH /knowledge/:id { status: "active" }).
 */
export const KNOWLEDGE_CONFIDENCE_THRESHOLD = parseFloat(
  process.env.KNOWLEDGE_CONFIDENCE_THRESHOLD ?? "0.85"
);

/** Longest knowledge value stored from the model. */
export const MAX_KNOWLEDGE_VALUE_CHARS = 500;

/** A model-supplied dueDate more than this many days out is rejected. */
export const MAX_DUE_DATE_HORIZON_DAYS = 365;

/** A model-supplied dueDate further in the past than this is rejected. */
export const DUE_DATE_PAST_TOLERANCE_MS = 5 * 60 * 1000;

/** Max messages sent to the model per run; the rest are picked up by a follow-up run. */
export const MAX_DELTA_MESSAGES = parseInt(process.env.EXTRACTION_MAX_DELTA ?? "40", 10);

/** After this many consecutive failures on the same delta, skip it so it can't block the cursor forever. */
export const MAX_DELTA_FAILURES = parseInt(process.env.EXTRACTION_MAX_DELTA_FAILURES ?? "3", 10);
