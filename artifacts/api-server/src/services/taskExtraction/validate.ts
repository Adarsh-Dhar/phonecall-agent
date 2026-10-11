import type { KnowledgeAction, TaskAction } from "./types";

const TASK_TYPES = ["create", "update", "complete", "cancel"] as const;
const PRIORITIES = ["low", "normal", "high"] as const;
const KINDS = ["call", "reminder"] as const;
const KNOWLEDGE_TYPES = ["upsert", "invalidate"] as const;
export const KNOWLEDGE_CATEGORIES = ["preference", "fact", "history", "constraint", "contact_info"] as const;

const oneOf = <T extends string>(list: readonly T[], v: unknown): v is T =>
  typeof v === "string" && (list as readonly string[]).includes(v);

const str = (v: unknown, max: number): string | undefined => {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t ? t.slice(0, max) : undefined;
};

function confidenceOf(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > 1) return null;
  return v;
}

function sourceIdsOf(v: unknown): string[] | null {
  if (!Array.isArray(v)) return null;
  return v.filter((x): x is string => typeof x === "string" && x.length > 0);
}

/**
 * ISO 8601 date-time WITH an explicit UTC offset ("Z" or ±hh:mm), in the future
 * and within ~2 years. Anything else returns null: a missing offset would be
 * read in server time, a date-only value has no time, and a past/far-future
 * value is a model slip.
 */
export function parseModelDueDate(value: unknown, now = new Date()): Date | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})$/i.test(v)) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  if (d.getTime() < now.getTime()) return null;
  if (d.getTime() > now.getTime() + 2 * 365 * 24 * 3600 * 1000) return null;
  return d;
}

/** Returns a cleaned TaskAction, or null if the model's object is unusable. */
export function sanitizeTaskAction(raw: unknown): TaskAction | null {
  if (typeof raw !== "object" || raw === null) return null;
  const a = raw as Record<string, unknown>;
  if (!oneOf(TASK_TYPES, a.type)) return null;
  const confidence = confidenceOf(a.confidence);
  const sourceMessageIds = sourceIdsOf(a.sourceMessageIds);
  if (confidence === null || sourceMessageIds === null) return null;

  const taskId = str(a.taskId, 100);
  const title = str(a.title, 200);
  if (a.type === "create" && !title) return null;
  if (a.type !== "create" && !taskId) return null;

  return {
    type: a.type,
    taskId,
    title,
    description: str(a.description, 2000),
    dueDate: str(a.dueDate, 40),
    priority: oneOf(PRIORITIES, a.priority) ? a.priority : undefined,
    kind: oneOf(KINDS, a.kind) ? a.kind : undefined,
    confidence,
    sourceMessageIds,
  };
}

const normaliseKey = (k: string) =>
  k.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60);

export function sanitizeKnowledgeAction(raw: unknown): KnowledgeAction | null {
  if (typeof raw !== "object" || raw === null) return null;
  const a = raw as Record<string, unknown>;
  if (!oneOf(KNOWLEDGE_TYPES, a.type)) return null;
  const confidence = confidenceOf(a.confidence);
  const sourceMessageIds = sourceIdsOf(a.sourceMessageIds);
  const rawKey = str(a.key, 120);
  const key = rawKey ? normaliseKey(rawKey) : "";
  if (confidence === null || sourceMessageIds === null || !key) return null;

  if (a.type === "upsert") {
    if (!oneOf(KNOWLEDGE_CATEGORIES, a.category)) return null;
    const value = str(a.value, 500);
    if (!value) return null;
    return { type: "upsert", category: a.category, key, value, confidence, sourceMessageIds };
  }
  // invalidate: category is irrelevant, keep a valid placeholder for the type
  return {
    type: "invalidate",
    category: oneOf(KNOWLEDGE_CATEGORIES, a.category) ? a.category : "fact",
    key,
    confidence,
    sourceMessageIds,
  };
}

export function sanitizeExtraction(parsed: Record<string, unknown>) {
  const rawTasks = Array.isArray(parsed.taskActions) ? parsed.taskActions : [];
  const rawKnow = Array.isArray(parsed.knowledgeActions) ? parsed.knowledgeActions : [];
  const taskActions = rawTasks.map(sanitizeTaskAction).filter((x): x is TaskAction => x !== null);
  const knowledgeActions = rawKnow.map(sanitizeKnowledgeAction).filter((x): x is KnowledgeAction => x !== null);
  return {
    taskActions,
    knowledgeActions,
    dropped: rawTasks.length - taskActions.length + (rawKnow.length - knowledgeActions.length),
  };
}
