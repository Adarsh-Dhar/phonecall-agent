/**
 * Turns the consolidator's `promises` into open loops.
 *
 *   by "business"  ->  awaiting_business   (the sweeper checks in when it goes overdue)
 *   by "agent"     ->  commitment          (an owner reminder is created at the due time)
 *
 * A promise without a parseable date still becomes a loop (it shows up in the briefing) but has
 * no dueAt, so nothing fires for it.
 */
import { prisma } from "@workspace/db-prisma";
import { logger } from "../../lib/logger";
import { parseModelDueDate } from "../taskExtraction/validate";
import { firstFireAt } from "../taskKinds";
import { createOpenLoop, type OpenLoopKind } from "./loops";

const MAX_PROMISES = 5;

export const normalizeLoopText = (s: string) =>
  s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();

export interface ParsedPromise {
  kind: OpenLoopKind;
  text: string;
  dueAt: Date | null;
}

/** Pure: validate the model output and map it to loop candidates. */
export function parsePromises(raw: unknown, now: Date, tz: string): ParsedPromise[] {
  if (!Array.isArray(raw)) return [];
  const out: ParsedPromise[] = [];
  for (const p of raw.slice(0, MAX_PROMISES)) {
    const what = typeof p?.what === "string" ? p.what.replace(/\s+/g, " ").trim().slice(0, 300) : "";
    if (what.length < 3) continue;
    const kind: OpenLoopKind | null =
      p?.by === "business" ? "awaiting_business" : p?.by === "agent" ? "commitment" : null;
    if (!kind) continue;
    out.push({ kind, text: what, dueAt: parseModelDueDate(p?.dueAt, now, { allowDateOnly: true, tz }) });
  }
  return out;
}

export async function createLoopsFromPromises(opts: {
  relationshipId: string;
  callId: string;
  conversationId: string;
  contactId: string;
  ownerId: string;
  promises: unknown;
  now?: Date;
}): Promise<number> {
  const now = opts.now ?? new Date();
  const owner = await prisma.account.findUnique({ where: { id: opts.ownerId }, select: { timezone: true } });
  const tz = owner?.timezone || process.env.DEFAULT_TIMEZONE || "UTC";
  const parsed = parsePromises(opts.promises, now, tz);
  if (parsed.length === 0) return 0;

  const open = await prisma.openLoop.findMany({
    where: { relationshipId: opts.relationshipId, status: "open" },
    select: { kind: true, text: true },
  });
  const seen = new Set(open.map((l) => `${l.kind}|${normalizeLoopText(l.text)}`));

  let created = 0;
  for (const p of parsed) {
    const key = `${p.kind}|${normalizeLoopText(p.text)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const loop = await createOpenLoop({
      relationshipId: opts.relationshipId,
      kind: p.kind,
      text: p.text,
      dueAt: p.dueAt ?? undefined,
      sourceCallId: opts.callId,
    });
    created++;

    // Our own promise: remind the owner at the due time (owner kind, no call involved).
    if (p.kind === "commitment" && p.dueAt) {
      const task = await prisma.task.create({
        data: {
          title: `Reminder: ${p.text}`.slice(0, 200),
          description: "You (via your agent) promised this on a call.",
          kind: "reminder",
          status: "open",
          source: "agent",
          confidence: 0.9,
          conversationId: opts.conversationId,
          contactId: opts.contactId,
          dueDate: p.dueAt,
          nextAttemptAt: firstFireAt("reminder", p.dueAt, tz, now),
          schedulerStatus: "pending",
        },
      });
      await prisma.openLoop.update({ where: { id: loop.id }, data: { followUpTaskId: task.id } });
    }
  }
  logger.info({ callId: opts.callId, created }, "promiseLoops: loops created from promises");
  return created;
}
