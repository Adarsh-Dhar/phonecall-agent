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

export type NewMessage = {
  id: string;
  role: string;
  content: string;
  time: string;
};

export type TaskAction = {
  type: "create" | "update" | "complete" | "cancel";
  taskId?: string;
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: "low" | "normal" | "high";
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
  contact: { name: string; business: string };
};

export type ExtractionResult = {
  created: string[];
  updated: string[];
  completed: string[];
  cancelled: string[];
  knowledgeUpserted: string[];
  knowledgeInvalidated: string[];
};

export function emptyExtractionResult(): ExtractionResult {
  return {
    created: [],
    updated: [],
    completed: [],
    cancelled: [],
    knowledgeUpserted: [],
    knowledgeInvalidated: [],
  };
}
