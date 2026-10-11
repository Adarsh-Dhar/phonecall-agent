/**
 * BriefingBuilder - Build CallBriefing for phone agent
 *
 * Phase 2: Uses Relationship table for relationship-based memory
 * - Still uses raw-tail fallback (no consolidation yet)
 * - No consolidation wait (consolidation doesn't exist yet)
 */

import { prisma } from "@workspace/db-prisma";
import { logger } from "../../lib/logger";
import { getOrCreateRelationship } from "./relationship";
import type { CallBriefing, Fact, ClosureNotice } from "./types";
import { renderBriefing } from "./render";

interface BuildOptions {
  maxTokens?: number;
  consolidationWaitMs?: number;
}

/**
 * Build a briefing for a call
 *
 * Phase 2: Uses relationship-based data
 */
export async function buildBriefing(callId: string, options: BuildOptions = {}): Promise<CallBriefing> {
  const startTime = Date.now();

  // Load the call with its conversation and contact
  const call = await prisma.call.findUnique({
    where: { id: callId },
    select: {
      id: true,
      taskId: true,
      conversationId: true,
      contactId: true,
      individualId: true,
      businessId: true,
      direction: true,
      contact: {
        select: {
          id: true,
          name: true,
          business: true,
          ownerId: true,
        },
      },
    },
  });

  if (!call) {
    throw new Error(`Call not found: ${callId}`);
  }

  if (!call.individualId || !call.businessId) {
    throw new Error(`Call missing individualId or businessId: ${callId}`);
  }

  // Get or create the relationship
  const relationship = await getOrCreateRelationship({
    individualId: call.individualId,
    businessId: call.businessId,
    contactId: call.contactId,
  });

  // Load individual (owner) and business accounts
  const [individual, business] = await Promise.all([
    prisma.account.findUnique({
      where: { id: call.individualId },
      select: { id: true, name: true, timezone: true },
    }),
    prisma.account.findUnique({
      where: { id: call.businessId },
      select: { id: true, name: true, businessHoursJson: true },
    }),
  ]);

  if (!individual || !business) {
    throw new Error(`Individual or business account not found for call: ${callId}`);
  }

  // Load task context if present
  const taskContext = call.taskId
    ? await prisma.task.findUnique({
        where: { id: call.taskId },
        select: { id: true, title: true, description: true },
      })
    : null;

  // Load known facts (ContactKnowledge)
  const knowledge = await prisma.contactKnowledge.findMany({
    where: { contactId: call.contactId, status: "active" },
    select: { category: true, key: true, value: true },
    orderBy: { category: "asc" },
  });

  // Load owner info (shareable only)
  const ownerInfo = individual.id
    ? await prisma.ownerInfo.findMany({
        where: { ownerId: individual.id, shareable: true },
        select: { category: true, key: true, value: true },
      })
    : [];

  // Load recent calls (last 3 for this relationship via conversation)
  const recentCalls = await prisma.call.findMany({
    where: {
      conversationId: call.conversationId,
      status: "completed",
      endedAt: { not: null },
    },
    select: {
      id: true,
      endedAt: true,
      outcome: true,
      outcomeSummary: true,
      consolidatedAt: true,
    },
    orderBy: { endedAt: "desc" },
    take: 3,
  });

  // Load last call tail (last 14 turns from the most recent completed call)
  let lastCallTail: Array<{ speaker: string; text: string }> = [];
  if (recentCalls.length > 0) {
    const lastCall = recentCalls[0];
    const messages = await prisma.message.findMany({
      where: { callId: lastCall.id },
      select: { role: true, content: true, speaker: true },
      orderBy: { createdAt: "asc" },
      take: 14,
    });
    lastCallTail = messages.map((m) => ({
      speaker: m.speaker || (m.role === "assistant" ? "agent" : "contact"),
      text: m.content,
    }));
  }

  // Load open queries (pending queries for this conversation)
  const openQueries = await prisma.query.findMany({
    where: {
      conversationId: call.conversationId,
      status: "pending",
    },
    select: { question: true },
    orderBy: { createdAt: "desc" },
  });

  // Load answered queries (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const answeredQueries = await prisma.query.findMany({
    where: {
      conversationId: call.conversationId,
      status: "answered",
      answeredAt: { gte: sevenDaysAgo },
    },
    select: { question: true, answer: true },
    orderBy: { answeredAt: "desc" },
  });

  // Load open tasks
  const openTasks = await prisma.task.findMany({
    where: {
      conversationId: call.conversationId,
      status: { in: ["suggested", "open", "in_progress", "waiting_user"] },
    },
    select: { title: true, dueDate: true },
    orderBy: { dueDate: "asc" },
  });

  // Phase 4: Load open loops from the relationship
  const openLoops = await prisma.openLoop.findMany({
    where: {
      relationshipId: relationship.id,
      status: "open",
    },
    select: { kind: true, text: true, dueAt: true },
    orderBy: { createdAt: "desc" },
  });

  // Check for business closures
  const closures = await prisma.businessClosure.findMany({
    where: {
      businessId: business.id,
      startsAt: { lte: new Date() },
      OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }],
    },
    select: {
      kind: true,
      label: true,
      message: true,
      startsAt: true,
      endsAt: true,
      allDay: true,
    },
    orderBy: { startsAt: "desc" },
    take: 1,
  });

  // Build the briefing
  const now = new Date();
  const nowIso = now.toISOString();
  const tz = individual.timezone || "UTC";

  const briefCallReason = taskContext
    ? {
        taskId: taskContext.id,
        title: taskContext.title,
        detail: taskContext.description || undefined,
      }
    : null;

  const briefKnownFacts: Fact[] = knowledge.map((k) => ({
    category: k.category,
    key: k.key,
    value: k.value,
  }));

  const briefShareableInfo: Fact[] = ownerInfo.map((o) => ({
    category: o.category,
    key: o.key,
    value: o.value,
  }));

  const briefRecentCalls = recentCalls.map((c) => ({
    at: c.endedAt!.toISOString(),
    outcome: c.outcome || "unknown",
    summary: c.outcomeSummary || "No summary",
    consolidated: !!c.consolidatedAt,
  }));

  const briefOpenLoops = openLoops.map((loop) => ({
    kind: loop.kind,
    text: loop.text,
    dueAt: loop.dueAt?.toISOString(),
  }));

  const briefAnsweredSince = answeredQueries.map((q) => ({
    question: q.question,
    answer: q.answer || "",
  }));

  const briefClosedNow = closures.length > 0
    ? {
        kind: closures[0].kind,
        label: closures[0].label || undefined,
        message: closures[0].message || undefined,
        allDay: closures[0].allDay,
        startsAt: closures[0].startsAt.toISOString(),
        endsAt: closures[0].endsAt?.toISOString(),
      }
    : undefined;

  const briefBusiness = {
    name: business.name,
    hours: business.businessHoursJson || undefined,
    closedNow: briefClosedNow,
  };

  // Phase 3: Check if the last call is consolidated
  const lastCallConsolidated = recentCalls.length > 0 && recentCalls[0].consolidatedAt !== null;

  // In Phase 3, quality.complete = true if the last call is consolidated
  const quality = {
    complete: lastCallConsolidated,
    staleSeconds: lastCallConsolidated ? 0 : Math.floor((Date.now() - (recentCalls[0]?.endedAt?.getTime() || Date.now())) / 1000),
  };

  const briefing: CallBriefing = {
    version: 1,
    relationshipId: relationship.id,
    callReason: briefCallReason,
    now: `${nowIso} (${tz})`,
    individual: {
      name: individual.name,
      shareableInfo: briefShareableInfo,
    },
    business: briefBusiness,
    knownFacts: briefKnownFacts,
    thread: {
      summary: relationship.summary || "", // Rolling summary from consolidation
      recentCalls: briefRecentCalls,
      lastCallTail,
    },
    openLoops: briefOpenLoops,
    answeredSince: briefAnsweredSince,
    doNot: [], // No doNot constraints in Phase 3
    quality,
  };

  const elapsed = Date.now() - startTime;
  logger.info(
    {
      callId,
      relationshipId: relationship.id,
      briefingVersion: briefing.version,
      tokenCount: Math.ceil(renderBriefing(briefing).length / 4),
      qualityComplete: quality.complete,
      elapsedMs: elapsed,
    },
    "BriefingBuilder: briefing built"
  );

  return briefing;
}
