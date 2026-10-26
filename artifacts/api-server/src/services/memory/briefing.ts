/**
 * BriefingBuilder - Build CallBriefing for phone agent
 *
 * Reads the thread for this individual <-> business pair and returns a
 * CallBriefing. Rules:
 * - Waits up to `consolidationWaitMs` (default 4 s, env CONSOLIDATION_WAIT_MS)
 *   for the previous call's post-call processing, then continues regardless.
 * - If the previous call is still unprocessed, the raw last turns of that call
 *   are used and quality.complete is false.
 * - History is scoped by contact (one individual<->business pair), never by
 *   conversation: a contact can have several Conversation rows.
 */

import { prisma } from "@workspace/db-prisma";
import { logger } from "../../lib/logger";
import { getOrCreateRelationship } from "./relationship";
import type { CallBriefing, Fact, ClosureNotice } from "./types";
import { renderBriefing } from "./render";

interface BuildOptions {
  maxTokens?: number;
  consolidationWaitMs?: number;
  /** Phase 5: If true, build briefing for business side (filters visibility to "both" only) */
  forBusiness?: boolean;
}

const CONSOLIDATION_POLL_MS = 250;
const CONSOLIDATION_PENDING_WINDOW_MS = 10 * 60 * 1000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Wait (bounded) while an earlier call with this contact has ended and has
 * transcript rows but is not consolidated yet. Never throws, never exceeds waitMs.
 */
export async function waitForConsolidation(contactId: string, currentCallId: string, waitMs: number): Promise<boolean> {
  if (waitMs <= 0) return false;
  const deadline = Date.now() + waitMs;
  const since = new Date(Date.now() - CONSOLIDATION_PENDING_WINDOW_MS);
  for (;;) {
    const pending = await prisma.call
      .findFirst({
        where: {
          contactId,
          id: { not: currentCallId },
          status: "completed",
          endedAt: { gte: since },
          consolidatedAt: null,
          messages: { some: {} },
        },
        select: { id: true },
      })
      .catch(() => null);
    if (!pending) return true;
    if (Date.now() + CONSOLIDATION_POLL_MS >= deadline) return false;
    await sleep(CONSOLIDATION_POLL_MS);
  }
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

  // Test calls to unlinked contacts won't have a businessId
  // In this case, skip briefing since there's no relationship history
  if (!call.individualId || !call.businessId) {
    logger.warn({ callId, individualId: call.individualId, businessId: call.businessId }, "briefing: call missing individualId or businessId, skipping briefing");
    return {
      summary: "",
      knownFacts: [],
      openLoops: [],
      businessContext: null,
      taskContext: null,
    };
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

  // Load owner info (shareable only, and only for individual-side briefings)
  // Phase 5: Business-side briefings should not see owner info
  const ownerInfo = !options.forBusiness && individual.id
    ? await prisma.ownerInfo.findMany({
        where: { ownerId: individual.id, shareable: true },
        select: { category: true, key: true, value: true },
      })
    : [];

  // Give the previous call's post-call processing a short, bounded chance to finish.
  const waitMs = options.consolidationWaitMs ?? (Number(process.env.CONSOLIDATION_WAIT_MS) || 4000);
  const waitedOk = await waitForConsolidation(call.contactId, call.id, waitMs);

  // Load recent calls (last 3 with this contact, newest first, excluding this call)
  const recentCalls = await prisma.call.findMany({
    where: {
      contactId: call.contactId,
      id: { not: call.id },
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
    // The LAST 14 turns (newest first from the DB, then put back in order).
    // Owner-only rows are never shown to the phone agent.
    const newestFirst = await prisma.message.findMany({
      where: { callId: lastCall.id!, visibility: "both" },
      select: { role: true, content: true, speaker: true },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 14,
    });
    const messages = newestFirst.reverse();
    lastCallTail = messages.map((m) => ({
      speaker: m.speaker || (m.role === "assistant" ? "agent" : "contact"),
      text: m.content,
    }));
  }

  // Load open queries (pending queries for this conversation)
  const openQueries = await prisma.query.findMany({
    where: {
      contactId: call.contactId,
      status: "pending",
    },
    select: { question: true },
    orderBy: { createdAt: "desc" },
  });

  // Load answered queries (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const answeredQueries = await prisma.query.findMany({
    where: {
      contactId: call.contactId,
      status: "answered",
      answeredAt: { gte: sevenDaysAgo },
    },
    select: { question: true, answer: true },
    orderBy: { answeredAt: "desc" },
  });

  // Load open tasks
  const openTasks = await prisma.task.findMany({
    where: {
      contactId: call.contactId,
      status: { in: ["suggested", "open", "in_progress", "waiting_user"] },
    },
    select: { title: true, dueDate: true },
    orderBy: { dueDate: "asc" },
  });

  // Phase 4: Load open loops from the relationship
  // Phase 5: Filter by visibility for business-side briefings
  const openLoops = await prisma.openLoop.findMany({
    where: {
      relationshipId: relationship.id,
      status: "open",
      ...(options.forBusiness ? { visibility: "both" } : {}),
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
  const tz = individual.timezone || process.env.DEFAULT_TIMEZONE || "Asia/Kolkata";

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

  const briefShareableInfo: Fact[] = Array.isArray(ownerInfo) ? ownerInfo.map((o) => ({
    category: o.category,
    key: o.key,
    value: o.value,
  })) : [];

  const summaries = recentCalls.length
    ? await prisma.callSummary.findMany({ where: { callId: { in: recentCalls.map((c) => c.id) } } })
    : [];
  const summaryByCall = new Map(summaries.map((x) => [x.callId, x]));
  const asLines = (v: unknown, pick: (o: any) => string): string[] =>
    Array.isArray(v) ? v.map((o) => pick(o || {})).filter(Boolean) : [];

  const briefRecentCalls = recentCalls.map((c) => {
    const cs = summaryByCall.get(c.id);
    return {
      at: c.endedAt!.toISOString(),
      outcome: cs?.outcome || c.outcome || "unknown",
      summary: cs?.summary || c.outcomeSummary || "No summary yet",
      consolidated: !!c.consolidatedAt,
      proposals: asLines(cs?.proposals, (o) => [o.what, o.when].filter(Boolean).join(" at ")),
      agreements: asLines(cs?.agreements, (o) => [o.what, o.when].filter(Boolean).join(" at ")),
      promises: asLines(cs?.promises, (o) => (o.by ? `${o.by}: ` : "") + (o.what || "")),
    };
  });

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
        kind: closures[0].kind as "holiday" | "out_of_service" | "emergency",
        label: closures[0].label || undefined,
        message: closures[0].message || undefined,
        allDay: closures[0].allDay,
        startsAt: closures[0].startsAt.toISOString(),
        endsAt: closures[0].endsAt?.toISOString(),
      }
    : undefined;

  const briefBusiness = {
    name: business.name || '',
    hours: business.businessHoursJson || undefined,
    closedNow: briefClosedNow,
  };

  // Complete when there is no earlier call, or the latest earlier call is consolidated.
  // (The first call ever with a business is complete: there is simply nothing to add.)
  const lastCallConsolidated = recentCalls.length === 0 || recentCalls[0].consolidatedAt !== null;
  const quality = {
    complete: lastCallConsolidated,
    staleSeconds: lastCallConsolidated
      ? 0
      : Math.max(0, Math.floor((Date.now() - (recentCalls[0]?.endedAt?.getTime() || Date.now())) / 1000)),
  };
  if (!lastCallConsolidated) {
    logger.warn({ callId, waitedOk, waitMs }, "BriefingBuilder: previous call not consolidated, using raw tail");
  }

  const briefing: CallBriefing = {
    version: 1,
    relationshipId: relationship.id,
    callReason: briefCallReason,
    now: `${nowIso} (${tz})`,
    timezone: tz,
    individual: {
      name: individual.name || '',
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
    doNot: [
      "Do not invent details (codes, prices, names) that are not in your instructions or told to you on this call.",
      "Do not treat a proposed time or price as confirmed unless the other person confirmed it and it is listed as agreed.",
    ],
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
