import type { EndCallArgs } from "./callLifecycle";

export const END_CALL_OUTCOMES = ["booked", "rescheduled", "cancelled", "info_gathered", "needs_user", "failed"] as const;
const FOLLOW_UP_KINDS = ["bring", "pay", "submit", "follow_up"] as const;
const MAX_FOLLOW_UPS = 20;

const str = (v: unknown, max: number): string | undefined =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined;

function validDate(v: unknown): Date | undefined {
  if (typeof v !== "string" || !v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/**
 * end_call arguments come from a model and must be treated as untrusted:
 * - outcome outside the enum            -> "failed"
 * - summary not a string                -> stringified/truncated, or a placeholder
 * - confirmedAt unparseable             -> dropped
 * - booked/rescheduled without a valid FUTURE confirmedAt -> downgraded to needs_user
 * - followUps not an array / too many   -> sanitised and capped
 */
export function normalizeEndCallArgs(raw: unknown, now: Date = new Date()): EndCallArgs {
  const a = (raw && typeof raw === "object" ? raw : {}) as Record<string, any>;

  let outcome = (END_CALL_OUTCOMES as readonly string[]).includes(a.outcome) ? (a.outcome as EndCallArgs["outcome"]) : "failed";

  let summary = str(a.summary, 2000);
  if (!summary && a.summary != null && typeof a.summary === "object") {
    try { summary = JSON.stringify(a.summary).slice(0, 2000); } catch { /* ignore */ }
  }
  summary ??= "No summary provided";

  const when = validDate(a.confirmedAt);
  let confirmedAt = when ? when.toISOString() : undefined;

  if ((outcome === "booked" || outcome === "rescheduled") && (!when || when.getTime() <= now.getTime())) {
    outcome = "needs_user";
    confirmedAt = undefined;
    summary = `${summary} [downgraded: no valid future confirmation time]`.slice(0, 2000);
  }

  const followUps = Array.isArray(a.followUps)
    ? a.followUps
        .slice(0, MAX_FOLLOW_UPS)
        .filter((f: any) => f && (FOLLOW_UP_KINDS as readonly string[]).includes(f.kind) && str(f.title, 200))
        .map((f: any) => ({
          kind: f.kind,
          title: str(f.title, 200)!,
          dueAt: validDate(f.dueAt)?.toISOString(),
          details: str(f.details, 1000),
        }))
    : undefined;

  return { outcome, summary, confirmedAt, confirmationRef: str(a.confirmationRef, 200), followUps };
}
