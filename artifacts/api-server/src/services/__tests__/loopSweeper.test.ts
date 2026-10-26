import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } }));

const { prisma } = vi.hoisted(() => ({ prisma: {
  openLoop: { findMany: vi.fn(), updateMany: vi.fn(), update: vi.fn() },
  task: { findFirst: vi.fn(), create: vi.fn(), findMany: vi.fn() },
  call: { findUnique: vi.fn() },
  conversation: { findFirst: vi.fn() },
} }));
vi.mock("@workspace/db-prisma", () => ({ prisma }));

import { sweepOverdueLoops } from "../memory/loopSweeper";

const NOW = new Date("2026-10-30T12:00:00Z");
const DEFAULT_CHECKIN_GRACE_MS = 120 * 60_000;
const loop = (agentMode: boolean) => ({
  id: "L1",
  text: "Call back with the quote",
  dueAt: new Date(+NOW - DEFAULT_CHECKIN_GRACE_MS - 60_000),
  sourceCallId: "c1",
  relationship: { individualId: "o1", contactId: "k1", individual: { agentMode } },
});

describe("sweepOverdueLoops", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prisma.openLoop.findMany.mockResolvedValueOnce([]).mockResolvedValue([]);
    prisma.openLoop.updateMany.mockResolvedValue({ count: 1 });
    prisma.call.findUnique.mockResolvedValue({ conversationId: "cv1" });
    prisma.task.findFirst.mockResolvedValue(null);
    prisma.task.create.mockResolvedValue({ id: "T1" });
    prisma.task.findMany.mockResolvedValue([]);
  });

  it("queries only overdue awaiting_business loops that have not been actioned", async () => {
    await sweepOverdueLoops(NOW);
    const where = prisma.openLoop.findMany.mock.calls[0][0].where;
    expect(where).toMatchObject({ status: "open", kind: "awaiting_business", followUpTaskId: null, lastActionAt: null });
    expect(where.dueAt.lte.getTime()).toBe(+NOW - DEFAULT_CHECKIN_GRACE_MS);
  });

  it("creates an OPEN check-in call task in agent mode and links the loop", async () => {
    prisma.openLoop.findMany.mockReset();
    prisma.openLoop.findMany.mockResolvedValueOnce([loop(true)]).mockResolvedValue([]);
    const r = await sweepOverdueLoops(NOW);
    const data = prisma.task.create.mock.calls[0][0].data;
    expect(data).toMatchObject({ kind: "call", status: "open", contactId: "k1", conversationId: "cv1", schedulerStatus: "pending" });
    expect(data.nextAttemptAt).toEqual(NOW);
    expect(prisma.openLoop.update).toHaveBeenCalledWith({ where: { id: "L1" }, data: { followUpTaskId: "T1" } });
    expect(r.created).toBe(1);
  });

  it("creates a SUGGESTED task when agent mode is off", async () => {
    prisma.openLoop.findMany.mockReset();
    prisma.openLoop.findMany.mockResolvedValueOnce([loop(false)]).mockResolvedValue([]);
    await sweepOverdueLoops(NOW);
    expect(prisma.task.create.mock.calls[0][0].data.status).toBe("suggested");
  });

  it("does nothing when another instance already claimed the loop", async () => {
    prisma.openLoop.findMany.mockReset();
    prisma.openLoop.findMany.mockResolvedValueOnce([loop(true)]).mockResolvedValue([]);
    prisma.openLoop.updateMany.mockResolvedValueOnce({ count: 0 }).mockResolvedValue({ count: 0 });
    const r = await sweepOverdueLoops(NOW);
    expect(prisma.task.create).not.toHaveBeenCalled();
    expect(r.created).toBe(0);
  });

  it("releases the claim when task creation fails so the next cycle retries", async () => {
    prisma.openLoop.findMany.mockReset();
    prisma.openLoop.findMany.mockResolvedValueOnce([loop(true)]).mockResolvedValue([]);
    prisma.task.create.mockRejectedValue(new Error("db down"));
    await sweepOverdueLoops(NOW);
    expect(prisma.openLoop.update).toHaveBeenCalledWith({ where: { id: "L1" }, data: { lastActionAt: null } });
  });

  it("resolves a loop whose check-in finished and expires one whose task was cancelled", async () => {
    prisma.openLoop.findMany.mockReset();
    prisma.openLoop.findMany
      .mockResolvedValueOnce([]) // overdue query
      .mockResolvedValueOnce([
        { id: "A", followUpTaskId: "t-done" },
        { id: "B", followUpTaskId: "t-cancelled" },
        { id: "C", followUpTaskId: "t-exhausted" },
      ]);
    prisma.task.findMany.mockResolvedValue([
      { id: "t-done", status: "done", schedulerStatus: "done" },
      { id: "t-cancelled", status: "cancelled", schedulerStatus: "done" },
      { id: "t-exhausted", status: "open", schedulerStatus: "exhausted" },
    ]);
    const r = await sweepOverdueLoops(NOW);
    expect(r.resolved).toBe(1);
    expect(r.expired).toBe(2 + 1); // 2 from reconcile + 1 from the ancient-loop updateMany mock (count: 1)
    const calls = prisma.openLoop.updateMany.mock.calls.map((c: any) => c[0]);
    expect(calls.find((c: any) => c.data.status === "resolved").where.id.in).toEqual(["A"]);
    expect(calls.find((c: any) => c.data.status === "expired" && c.where.id)?.where.id.in).toEqual(["B", "C"]);
  });

  it("never throws", async () => {
    prisma.openLoop.findMany.mockReset();
    prisma.openLoop.findMany.mockRejectedValue(new Error("boom"));
    await expect(sweepOverdueLoops(NOW)).resolves.toEqual({ created: 0, resolved: 0, expired: 0 });
  });
});
