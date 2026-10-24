/**
 * Calendar event → "call" intent + contact matching.
 *
 * Pure functions only (no DB, no clock reads except via the `now` argument) so the
 * rules are unit-testable and the ingest service (calendarIngest.ts) stays thin.
 *
 * Convention a user follows in Google Calendar:
 *   - The title (or description) contains a call word: "Call Dr Mehta", "Phone call – Sharma Clinic",
 *     "Ring the plumber", "Callback: Acme Salon".
 *   - The title (or a "Contact: Name" line in the description) names one of their saved contacts
 *     (by contact name or business name).
 *   - Add "#nocall" anywhere in the title/description to opt a specific event out.
 *   - The event must have a start time (all-day events have no "exact time" and are ignored).
 */

export interface CalendarEventLike {
  id: string;
  summary: string | null;
  description: string | null;
  start: { dateTime?: string; date?: string } | null;
  end?: { dateTime?: string; date?: string } | null;
  status: string;
  /** Who created / organizes the event. Used to refuse invites sent by other people. */
  creatorSelf?: boolean;
  organizerSelf?: boolean;
}

export interface ContactLike {
  id: string;
  name: string | null;
  business: string | null;
  linkedAccountId: string | null;
}

/** Words that mean "this event is a phone call". */
const CALL_WORD_RE = /\b(call(?:\s?back)?|callback|phone(?:\s?call)?|ring|dial)\b/i;
const OPT_OUT_RE = /#no[-_ ]?call\b/i;

/** Removed before matching the rest of the title against contact names. */
const NOISE_WORDS = new Set([
  "call", "calls", "callback", "back", "phone", "ring", "dial", "with", "to", "the", "a", "an",
  "about", "re", "for", "and", "regarding", "follow", "up", "followup", "schedule",
  "scheduled", "agent", "ai", "please", "my", "at", "on", "of",
]);

export function normalize(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function tokens(text: string): string[] {
  const n = normalize(text);
  return n ? n.split(" ") : [];
}

/**
 * True when the event should make the AI agent place a call:
 * not cancelled, has an exact start time, mentions a call word, not opted out,
 * and was created/organised by the calendar owner (never by an outside inviter).
 */
export function isCallEvent(event: CalendarEventLike): boolean {
  if (event.status === "cancelled") return false;
  if (!event.start?.dateTime) return false; // all-day / undated → no exact time

  // Calendar invites from other people land on your calendar automatically. Their
  // title/description would become instructions for the agent, so refuse them.
  const selfOwned = event.organizerSelf === true || event.creatorSelf === true;
  if (!selfOwned) return false;

  const haystack = `${event.summary ?? ""}\n${event.description ?? ""}`;
  if (OPT_OUT_RE.test(haystack)) return false;
  return CALL_WORD_RE.test(event.summary ?? "") || /#call\b/i.test(event.description ?? "");
}

export type MatchResult =
  | { ok: true; contact: ContactLike }
  | { ok: false; reason: "no_match" | "ambiguous"; candidates?: ContactLike[] };

/** "Contact: Dr Mehta (Mehta Clinic)" lines written by createEvent() in taskSync.ts. */
function contactLine(description: string | null): string | null {
  const m = description?.match(/^\s*Contact:\s*(.+)$/im);
  return m ? m[1] : null;
}

/**
 * Score every contact against the event and return the single best one.
 *  - A whole contact/business name found inside the title scores 100 + its length.
 *  - Otherwise, if every meaningful word left in the title (after removing "call", "with", …)
 *    appears among the contact's name/business words, it scores the number of those words.
 * A tie at the top is "ambiguous" and nothing is dialled — better to skip than call the wrong business.
 */
export function matchContact(event: CalendarEventLike, contacts: ContactLike[]): MatchResult {
  const title = normalize(event.summary ?? "");
  const extra = normalize(contactLine(event.description) ?? "");
  const hay = ` ${title} ${extra} `;
  const subject = tokens(event.summary ?? "").filter((t) => !NOISE_WORDS.has(t));

  const scored: Array<{ contact: ContactLike; score: number }> = [];

  for (const contact of contacts) {
    const keys = [contact.name, contact.business]
      .filter((k): k is string => !!k)
      .map(normalize)
      .filter((k) => k.length >= 3);
    if (keys.length === 0) continue;

    let score = 0;
    for (const key of keys) {
      if (hay.includes(` ${key} `)) score = Math.max(score, 100 + key.length);
    }

    if (score === 0 && subject.length > 0) {
      const contactWords = new Set(keys.flatMap((k) => k.split(" ")));
      if (subject.every((t) => contactWords.has(t))) score = subject.length;
    }

    if (score > 0) scored.push({ contact, score });
  }

  if (scored.length === 0) return { ok: false, reason: "no_match" };

  scored.sort((a, b) => b.score - a.score);
  const top = scored.filter((s) => s.score === scored[0].score);
  if (top.length > 1) return { ok: false, reason: "ambiguous", candidates: top.map((t) => t.contact) };

  // A contact with no linkedAccountId can't be dialled in-app; the scheduler then falls back to
  // the "call due" notification for it, so it is still a valid match here.
  return { ok: true, contact: scored[0].contact };
}

/**
 * Should a brand-new calendar event still create a task? Events that already started more than
 * `graceMs` ago are history (this is what stops the very first full sync from "calling" every
 * old event on the calendar).
 */
export function isStillUpcoming(startsAt: Date, now: Date, graceMs: number): boolean {
  return startsAt.getTime() >= now.getTime() - graceMs;
}
