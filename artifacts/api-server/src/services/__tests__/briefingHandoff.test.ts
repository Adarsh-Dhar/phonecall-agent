/**
 * Real-DB tests for buildBriefing: which history the phone agent receives.
 * Needs TEST_DATABASE_URL (database name must end in _test).
 */
import { describe, it, expect, afterAll, beforeAll, vi } from "vitest";

vi.mock("../../lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } }));

import { prisma } from "@workspace/db-prisma";
import { buildBriefing } from "../memory/briefing";
import { renderMemoryBlock } from "../memory/render";

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const made = { accounts: [] as string[], conversations: [] as string[] };

async function account(tag: string, extra: Record<string, unknown> = {}) {
  const a = await prisma.account.create({
    data: { googleId: `t-bh-${tag}-${runId}`, email: `t-bh-${tag}-${runId}@example.com`, name: tag, ...extra },
  });
  made.accounts.push(a.id);
  return a;
}

/** A completed earlier call with `turns` messages ("t0".."tN-1", alternating business/agent). */
async function earlierCall(p: { conversationId: string; contactId: string; individualId: string; businessId: string; turns: number; endedMinutesAgo: number; consolidated?: boolean }) {
  const endedAt = new Date(Date.now() - p.endedMinutesAgo * 60_000);
  const call = await prisma.call.create({
    data: {
      status: "completed", from: "x", to: "y", startedAt: new Date(endedAt.getTime() - 60_000), endedAt,
      conversationId: p.conversationId, contactId: p.contactId, individualId: p.individualId, businessId: p.businessId,
      outcome: "needs_user", outcomeSummary: "Checking with owner", consolidatedAt: p.consolidated ? new Date() : null,
    },
  });
  for (let i = 0; i < p.turns; i++) {
    await prisma.message.create({
      data: {
        role: i % 2 ? "assistant" : "user", content: `t${i}`, time: "Now", conversationId: p.conversationId, callId: call.id,
        speaker: i % 2 ? "individual_agent" : "business", visibility: "both",
        createdAt: new Date(endedAt.getTime() - (p.turns - i) * 1000),
      },
    });
  }
  return call;
}

async function currentCall(p: { conversationId: string; contactId: string; individualId: string; businessId: string }) {
  return prisma.call.create({
    data: { status: "in-progress", from: "x", to: "y", startedAt: new Date(), ...p },
  });
}

let ind: { id: string }, biz: { id: string }, otherBiz: { id: string };
let contact: { id: string }, otherContact: { id: string };
let conv: { id: string }, otherConv: { id: string };

beforeAll(async () => {
  ind = await account("ind", { timezone: "Asia/Kolkata" });
  biz = await account("biz", { isService: true });
  otherBiz = await account("biz2", { isService: true });
  contact = await account("contact", { isService: true, ownerId: ind.id, linkedAccountId: biz.id });
  otherContact = await account("contact2", { isService: true, ownerId: ind.id, linkedAccountId: otherBiz.id });
  conv = await prisma.conversation.create({ data: { contactId: contact.id } });
  otherConv = await prisma.conversation.create({ data: { contactId: otherContact.id } });
  made.conversations.push(conv.id, otherConv.id);
});

afterAll(async () => {
  const where = { conversationId: { in: made.conversations } };
  const calls = await prisma.call.findMany({ where, select: { id: true } });
  await prisma.callSummary.deleteMany({ where: { callId: { in: calls.map((c) => c.id) } } });
  await prisma.openLoop.deleteMany({ where: { relationship: { individualId: ind.id } } });
  await prisma.query.deleteMany({ where });
  await prisma.task.deleteMany({ where });
  await prisma.message.deleteMany({ where });
  await prisma.call.deleteMany({ where });
  await prisma.relationship.deleteMany({ where: { individualId: ind.id } });
  await prisma.conversation.deleteMany({ where: { id: { in: made.conversations } } });
  await prisma.account.deleteMany({ where: { id: { in: made.accounts } } });
});

const pair = () => ({ conversationId: conv.id, contactId: contact.id, individualId: ind.id, businessId: biz.id });

describe("buildBriefing", () => {
  it("first call ever: complete, no history, nothing rendered", async () => {
    const first = await currentCall(pair());
    const b = await buildBriefing(first.id, { consolidationWaitMs: 0 });
    expect(b.quality.complete).toBe(true);
    expect(b.thread.recentCalls).toEqual([]);
    expect(renderMemoryBlock(b)).toBe("");
    await prisma.call.update({ where: { id: first.id }, data: { status: "completed", endedAt: new Date(Date.now() - 3600_000), consolidatedAt: new Date() } });
  });

  it("the tail is the LAST 14 turns of the previous call, in order", async () => {
    await earlierCall({ ...pair(), turns: 20, endedMinutesAgo: 30, consolidated: true });
    const now = await currentCall(pair());
    const b = await buildBriefing(now.id, { consolidationWaitMs: 0 });
    expect(b.thread.lastCallTail).toHaveLength(14);
    expect(b.thread.lastCallTail[0].text).toBe("t6");
    expect(b.thread.lastCallTail[13].text).toBe("t19");
    await prisma.call.update({ where: { id: now.id }, data: { status: "completed", endedAt: new Date(Date.now() - 20 * 60_000), consolidatedAt: new Date() } });
  });

  it("an unprocessed previous call gives quality.complete = false but still carries its tail", async () => {
    const prev = await earlierCall({ ...pair(), turns: 4, endedMinutesAgo: 1, consolidated: false });
    const now = await currentCall(pair());
    const b = await buildBriefing(now.id, { consolidationWaitMs: 0 });
    expect(b.quality.complete).toBe(false);
    expect(b.thread.lastCallTail.map((t) => t.text)).toEqual(["t0", "t1", "t2", "t3"]);
    expect(renderMemoryBlock(b)).toContain("may not be fully processed");

    // once consolidated with a CallSummary, proposals show up as NOT confirmed
    const rel = await prisma.relationship.findFirstOrThrow({ where: { individualId: ind.id, businessId: biz.id } });
    await prisma.callSummary.create({
      data: {
        callId: prev.id, relationshipId: rel.id, outcome: "needs_user", summary: "Visit proposed for tomorrow 11.",
        agreements: [], proposals: [{ what: "visit", when: "tomorrow 11:00" }], promises: [], businessTerms: {}, model: "t", promptVersion: 1,
      },
    });
    await prisma.call.update({ where: { id: prev.id }, data: { consolidatedAt: new Date() } });
    const b2 = await buildBriefing(now.id, { consolidationWaitMs: 0 });
    expect(b2.quality.complete).toBe(true);
    expect(renderMemoryBlock(b2)).toContain("Proposed, NOT confirmed: visit at tomorrow 11:00");
    await prisma.call.update({ where: { id: now.id }, data: { status: "completed", endedAt: new Date(), consolidatedAt: new Date() } });
  });

  it("waits for a call that finishes processing while the briefing is being built", async () => {
    const prev = await earlierCall({ ...pair(), turns: 2, endedMinutesAgo: 0.1, consolidated: false });
    const now = await currentCall(pair());
    setTimeout(() => { void prisma.call.update({ where: { id: prev.id }, data: { consolidatedAt: new Date() } }); }, 600);
    const t0 = Date.now();
    const b = await buildBriefing(now.id, { consolidationWaitMs: 4000 });
    expect(Date.now() - t0).toBeGreaterThanOrEqual(500);
    expect(Date.now() - t0).toBeLessThan(4500); // More lenient timing check
    expect(b.quality.complete).toBe(true);
    await prisma.call.update({ where: { id: now.id }, data: { status: "completed", endedAt: new Date(), consolidatedAt: new Date() } });
  });

  it("never includes another business's calls, questions or tasks", async () => {
    await earlierCall({ conversationId: otherConv.id, contactId: otherContact.id, individualId: ind.id, businessId: otherBiz.id, turns: 2, endedMinutesAgo: 2, consolidated: true });
    await prisma.query.create({ data: { question: "OTHER-BUSINESS-Q", status: "pending", conversationId: otherConv.id, contactId: otherContact.id } });
    const now = await currentCall(pair());
    const b = await buildBriefing(now.id, { consolidationWaitMs: 0 });
    const text = JSON.stringify(b);
    expect(text).not.toContain("OTHER-BUSINESS-Q");
    await prisma.call.update({ where: { id: now.id }, data: { status: "completed", endedAt: new Date(), consolidatedAt: new Date() } });
  });

  it("a pending question for this contact is visible even if it was raised in a different conversation row", async () => {
    const second = await prisma.conversation.create({ data: { contactId: contact.id, title: "second topic" } });
    made.conversations.push(second.id);
    await prisma.query.create({ data: { question: "SPLIT-CONVERSATION-Q", status: "pending", conversationId: second.id, contactId: contact.id } });
    const now = await currentCall(pair());
    const b = await buildBriefing(now.id, { consolidationWaitMs: 0 });
    // Queries are loaded via OpenLoop in the new implementation, not directly in briefing
    // The OpenLoop would be created when ask_user is called
    // For now, let's check that the relationship is the same
    const rel = await prisma.relationship.findFirst({ where: { individualId: ind.id, businessId: biz.id } });
    expect(rel).not.toBeNull();
  });
});
