export const TASK_KINDS = ["appointment","bring","pay","submit","follow_up","call","reminder","other"] as const;
export type TaskKind = (typeof TASK_KINDS)[number];
export const AGENT_KINDS: TaskKind[] = ["call", "follow_up"];

export const normalizeKind = (k: unknown): TaskKind =>
  typeof k === "string" && (TASK_KINDS as readonly string[]).includes(k) ? (k as TaskKind) : "other";
export const executorOf = (k: TaskKind) => (AGENT_KINDS.includes(k) ? "agent" : "owner");
export const allowsDateOnly = (k: TaskKind) => ["pay","submit","follow_up"].includes(k);
export const syncsToCalendar = (k: TaskKind) => k !== "reminder" && k !== "other";

/** Status on creation. follow_up opens only in agent mode with a firm date. */
export function statusOnCreate(kind: TaskKind, confidence: number, o: { hasDate: boolean; agentMode?: boolean }) {
  if (kind === "appointment") return "open";
  if (["bring","pay","submit","reminder"].includes(kind)) return confidence >= 0.85 ? "open" : "suggested";
  if (kind === "follow_up") return o.agentMode && o.hasDate && confidence >= 0.9 ? "open" : "suggested";
  return "suggested"; // call, other
}

/* ---- timezone helpers ---- */
function tzOffsetMs(d: Date, tz: string) {
  const p = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit",
    day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(d);
  const g = (t: string) => Number(p.find((x) => x.type === t)!.value);
  return Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"), g("second")) - Math.floor(d.getTime() / 1000) * 1000;
}
/** Owner-local wall-clock time (hour:00) on the day `dayShift` days from base's local date. */
export function localAt(base: Date, tz: string, dayShift: number, hour: number): Date {
  const off = tzOffsetMs(base, tz);
  const l = new Date(base.getTime() + off);
  return new Date(Date.UTC(l.getUTCFullYear(), l.getUTCMonth(), l.getUTCDate() + dayShift, hour) - off);
}

const H = 3600_000;
/** Planned reminder instants (not filtered for the past). */
export function reminderPlan(kind: TaskKind, due: Date, tz: string): Date[] {
  switch (kind) {
    case "appointment": return [new Date(+due - 24 * H), new Date(+due - 2 * H)];
    case "bring":       return [localAt(due, tz, -1, 19), new Date(+due - 2 * H)];
    case "pay":
    case "submit":      return [localAt(due, tz, -3, 10), localAt(due, tz, -1, 10), localAt(due, tz, 0, 9)];
    case "reminder":    return [due];
    default:            return [];
  }
}

/** First wake-up. Agent kinds fire at due; owner kinds at the first future plan slot. */
export function firstFireAt(kind: TaskKind, due: Date | null, tz: string, now = new Date()): Date | null {
  if (!due) return null;
  if (executorOf(kind) === "agent") return due;
  const next = reminderPlan(kind, due, tz).find((t) => t > now);
  return next ?? (due > now ? now : null); // all slots past but due ahead: fire once now
}

/** Next wake-up after a reminder was sent; null means the plan is finished. */
export function nextFireAfter(kind: TaskKind, due: Date, tz: string, lastAttemptAt: Date): Date | null {
  return reminderPlan(kind, due, tz).find((t) => t > lastAttemptAt && t > new Date()) ?? null;
}

/* ---- meta sanitiser ---- */
const s = (v: unknown, n: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, n) : undefined);
export function sanitizeMeta(_kind: TaskKind, raw: unknown): Record<string, unknown> | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const m = raw as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  if (Array.isArray(m.items)) out.items = m.items.map((x) => s(x, 100)).filter(Boolean).slice(0, 10);
  if (typeof m.amount === "number" && Number.isFinite(m.amount) && m.amount >= 0) out.amount = m.amount;
  if (s(m.currency, 8)) out.currency = s(m.currency, 8);
  if (s(m.ref, 60)) out.ref = s(m.ref, 60);
  if (s(m.location, 200)) out.location = s(m.location, 200);
  if (s(m.payAtVisit, 100)) out.payAtVisit = s(m.payAtVisit, 100);
  if (typeof m.allDay === "boolean") out.allDay = m.allDay;
  const json = JSON.stringify(out);
  return json.length > 2048 || json === "{}" ? undefined : out;
}
