/**
 * OpenLoop service - manages pending items (queries, tasks, commitments)
 *
 * Phase 4: Track open loops from queries, tasks, and call promises
 */

import { prisma } from "@workspace/db-prisma";
import { logger } from "../../lib/logger";

export type OpenLoopKind = "awaiting_owner" | "awaiting_business" | "scheduled" | "commitment";
export type OpenLoopStatus = "open" | "resolved" | "expired";
export type Visibility = "both" | "individual_only";

interface CreateOpenLoopOptions {
  relationshipId: string;
  kind: OpenLoopKind;
  text: string;
  dueAt?: Date;
  sourceCallId?: string;
  taskId?: string;
  queryId?: string;
  visibility?: Visibility;
}

/**
 * Create an open loop
 */
export async function createOpenLoop(opts: CreateOpenLoopOptions) {
  const { relationshipId, kind, text, dueAt, sourceCallId, taskId, queryId, visibility = "individual_only" } = opts;

  const openLoop = await prisma.openLoop.create({
    data: {
      relationshipId,
      kind,
      text,
      dueAt,
      sourceCallId,
      taskId,
      queryId,
      visibility,
    },
  });

  logger.info(
    { openLoopId: openLoop.id, relationshipId, kind, text },
    "openLoop: created"
  );

  return openLoop;
}

/**
 * Resolve an open loop
 */
export async function resolveOpenLoop(id: string) {
  const openLoop = await prisma.openLoop.update({
    where: { id },
    data: {
      status: "resolved",
      resolvedAt: new Date(),
    },
  });

  logger.info({ openLoopId: id }, "openLoop: resolved");

  return openLoop;
}

/**
 * Get open loops for a relationship
 */
export async function getOpenLoops(relationshipId: string, status?: OpenLoopStatus) {
  return prisma.openLoop.findMany({
    where: {
      relationshipId,
      ...(status && { status }),
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Resolve open loops by queryId (when a query is answered)
 */
export async function resolveOpenLoopsByQueryId(queryId: string) {
  const openLoops = await prisma.openLoop.findMany({
    where: { queryId, status: "open" },
  });

  for (const openLoop of openLoops) {
    await resolveOpenLoop(openLoop.id);
  }

  logger.info({ queryId, count: openLoops.length }, "openLoop: resolved by queryId");

  return openLoops;
}

/**
 * Resolve open loops by taskId (when a task is completed)
 */
export async function resolveOpenLoopsByTaskId(taskId: string) {
  const openLoops = await prisma.openLoop.findMany({
    where: { taskId, status: "open" },
  });

  for (const openLoop of openLoops) {
    await resolveOpenLoop(openLoop.id);
  }

  logger.info({ taskId, count: openLoops.length }, "openLoop: resolved by taskId");

  return openLoops;
}

/**
 * Create an open loop from a query (awaiting_owner)
 */
export async function createOpenLoopFromQuery(opts: {
  relationshipId: string;
  queryId: string;
  question: string;
  sourceCallId?: string;
}) {
  return createOpenLoop({
    relationshipId: opts.relationshipId,
    kind: "awaiting_owner",
    text: opts.question,
    queryId: opts.queryId,
    sourceCallId: opts.sourceCallId,
    visibility: "individual_only",
  });
}

/**
 * Create an open loop from a task (scheduled)
 */
export async function createOpenLoopFromTask(opts: {
  relationshipId: string;
  taskId: string;
  title: string;
  dueDate?: Date;
}) {
  return createOpenLoop({
    relationshipId: opts.relationshipId,
    kind: "scheduled",
    text: opts.title,
    taskId: opts.taskId,
    dueAt: opts.dueDate,
    visibility: "individual_only",
  });
}

/**
 * Create an open loop from a promise (commitment)
 */
export async function createOpenLoopFromPromise(opts: {
  relationshipId: string;
  sourceCallId: string;
  text: string;
  by: "agent" | "business";
  dueAt?: Date;
}) {
  return createOpenLoop({
    relationshipId: opts.relationshipId,
    kind: "commitment",
    text: opts.text,
    sourceCallId: opts.sourceCallId,
    dueAt: opts.dueAt,
    visibility: opts.by === "agent" ? "individual_only" : "both",
  });
}
