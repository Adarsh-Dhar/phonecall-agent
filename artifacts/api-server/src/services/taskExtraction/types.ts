import type { prisma } from "@workspace/db-prisma";

/** The client type available inside `prisma.$transaction(async (tx) => ...)`. */
export type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export type ExistingTask = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: string;
  priority: string;
};

/** Who actually said it. Raw Message.role is ambiguous: on a call, "user" is the
 *  external contact; in the app chat, "user" is the owner. */
export type Speaker = "owner" | "agent" | "contact";

export type NewMessage = {
  id: string;
  speaker: Speaker;
  content: string;
  time: string;
};

export type ExistingKnowledge = {
  key: string;
  category: string;
  value: string;
};

export type TaskAction = {
  type: "create" | "update" | "complete" | "cancel";
  taskId?: string;
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: "low" | "normal" | "high";
  kind?: "call" | "reminder";
  confidence: number;
  sourceMessageIds: string[];
};

export type KnowledgeAction = {
  type: "upsert" | "invalidate";
  category: "preference" | "fact" | "history" | "constraint" | "contact_info";
  key: string;
  value?: string;          // required for upsert
  confidence: number;
  sourceMessageIds: string[];
};

/** A task collected during reconciliation that needs a post-commit Calendar sync. */
export type TaskToSync = {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  status: string;
  googleEventId: string | null;
  contact: { name: string; business: string | null };
};

/** A model action that was NOT applied, and why. Never contains transcript text. */
export type SkippedAction = {
  kind: "task" | "knowledge";
  type: string;
  /** taskId for tasks, key for knowledge. */
  ref?: string;
  reason:
    | "low_confidence"
    | "unknown_task"
    | "no_source_message"
    | "invalid_due_date"
    | "would_overwrite_active_fact"
    | "unknown_fact"
    | "invalid_value"
    | "confidence below action threshold"
    | "no cited message from the new messages"
    | "taskId is not an active task in this conversation"
    | "duplicate of an active task"
    | "empty title"
    | "nothing valid to update";
};

export type ExtractionResult = {
  created: string[];
  updated: string[];
  completed: string[];
  cancelled: string[];
  knowledgeUpserted: string[];
  knowledgeInvalidated: string[];
  skipped: SkippedAction[];
};

export function emptyExtractionResult(): ExtractionResult {
  return {
    created: [],
    updated: [],
    completed: [],
    cancelled: [],
    knowledgeUpserted: [],
    knowledgeInvalidated: [],
    skipped: [],
  };
}
