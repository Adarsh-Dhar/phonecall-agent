import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } }));

const { prisma } = vi.hoisted(() => ({
  prisma: {
    account: { findUnique: vi.fn(), findFirst: vi.fn() },
    relationship: { updateMany: vi.fn(), update: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
    conversation: { create: vi.fn() },
    task: { create: vi.fn(), updateMany: vi.fn() },
  },
}));
vi.mock("@workspace/db-prisma", () => ({ prisma }));
vi.mock("../memory/relationship", () => ({ getOrCreateRelationship: vi.fn().mockResolvedValue({ id: "R1" }) }));

import { queueIntroCall, cancelIntroCall, recordIntroOutcome, isIntroTask } from "../introCall";

const IND = { id: "i1", isService: false, agentMode: true, name: "Alice" };
const BIZ = { id: "b1", isService: true, agentMode: false, name: "Bright Smile" };
const NOW = new Date("2026-10-30T12:00:00Z");

describe("queueIntroCall", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.INTRO_CALL_ENABLED = "true";
    prisma.account.findUnique.mockImplementation(async ({ where }: any) => (where.id === "i1" ? IND : where.id === "b1" ? BIZ : null));
    // first findFirst = individual's contact for the business, second = business's contact for the individual
    prisma.account.findFirst
      .mockResolvedValueOnce({ id: "k1", name: "Bright Smile", conversations: [{ id: "cv1" }] })
      .mockResolvedValueOnce({ id: "k2" });
    prisma.relationship.updateMany.mockResolvedValue({ count: 1 });
    prisma.relationship.count.mockResolvedValue(1);
    prisma.task.create.mockResolvedValue({ id: "T1" });
  });

  it("does nothing when the flag is off", async () => {
    process.env.INTRO_CALL_ENABLED = "false";
    expect(await queueIntroCall("i1", "b1", NOW)).toEqual({ queued: false, reason: "disabled" });
    expect(prisma.task.create).not.toHaveBeenCalled();
  });

  it("does nothing when only one side has saved the other", async () => {
    prisma.account.findFirst.mockReset();
    prisma.account.findFirst.mockResolvedValueOnce({ id: "k1", name: "x", conversations: [] }).mockResolvedValueOnce(null);
    expect(await queueIntroCall("i1", "b1", NOW)).toMatchObject({ queued: false, reason: "not_mutual" });
    expect(prisma.task.create).not.toHaveBeenCalled();
  });

  it("creates one open intro task when the pair is mutual and agent mode is on", async () => {
    const res = await queueIntroCall("i1", "b1", NOW);
    expect(res).toEqual({ queued: true, taskId: "T1" });
    const data = prisma.task.create.mock.calls[0][0].data;
    expect(data).toMatchObject({ kind: "call", status: "open", contactId: "k1", conversationId: "cv1", meta: { purpose: "intro" } });
    expect(data.dueDate).toEqual(NOW);
  });

  it("works the same when the business is the second to add (owner is the business)", async () => {
    expect((await queueIntroCall("b1", "i1", NOW)).queued).toBe(true);
  });

  it("creates a suggested task when agent mode is off", async () => {
    prisma.account.findUnique.mockImplementation(async ({ where }: any) => (where.id === "i1" ? { ...IND, agentMode: false } : BIZ));
    await queueIntroCall("i1", "b1", NOW);
    expect(prisma.task.create.mock.calls[0][0].data.status).toBe("suggested");
  });

  it("does not create a second task when the claim was already taken", async () => {
    prisma.relationship.updateMany.mockResolvedValueOnce({ count: 0 });
    expect(await queueIntroCall("i1", "b1", NOW)).toMatchObject({ queued: false, reason: "already_handled" });
    expect(prisma.task.create).not.toHaveBeenCalled();
  });

  it("spreads the call out once the hourly cap is passed", async () => {
    process.env.INTRO_CALL_MAX_PER_BUSINESS_HOUR = "2";
    prisma.relationship.count.mockResolvedValue(5);
    await queueIntroCall("i1", "b1", NOW);
    expect(+prisma.task.create.mock.calls[0][0].data.dueDate).toBe(+NOW + 3 * 2 * 60_000);
    delete process.env.INTRO_CALL_MAX_PER_BUSINESS_HOUR;
  });

  it("gives the claim back if the task cannot be created", async () => {
    prisma.task.create.mockRejectedValue(new Error("db down"));
    expect(await queueIntroCall("i1", "b1", NOW)).toMatchObject({ queued: false, reason: "error" });
    expect(prisma.relationship.updateMany).toHaveBeenLastCalledWith({ where: { id: "R1" }, data: { introStatus: "none", introQueuedAt: null } });
  });
});

describe("intro helpers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("isIntroTask reads meta.purpose", () => {
    expect(isIntroTask({ meta: { purpose: "intro" } })).toBe(true);
    expect(isIntroTask({ meta: { items: [] } })).toBe(false);
    expect(isIntroTask({ meta: null })).toBe(false);
  });

  it("recordIntroOutcome marks done / failed and ignores other outcomes", async () => {
    prisma.relationship.updateMany.mockResolvedValue({ count: 1 });
    await recordIntroOutcome("T1", "info_gathered");
    expect(prisma.relationship.updateMany).toHaveBeenLastCalledWith({ where: { introTaskId: "T1", introStatus: "queued" }, data: { introStatus: "done" } });
    await recordIntroOutcome("T1", "final_failure");
    expect(prisma.relationship.updateMany).toHaveBeenLastCalledWith({ where: { introTaskId: "T1", introStatus: "queued" }, data: { introStatus: "failed" } });
    prisma.relationship.updateMany.mockClear();
    await recordIntroOutcome("T1", "failed");
    expect(prisma.relationship.updateMany).not.toHaveBeenCalled();
  });

  it("cancelIntroCall cancels the pending task only while queued", async () => {
    prisma.relationship.findUnique.mockResolvedValue({ id: "R1", introStatus: "queued", introTaskId: "T1" });
    await cancelIntroCall("i1", "b1");
    expect(prisma.task.updateMany).toHaveBeenCalled();
    expect(prisma.relationship.update).toHaveBeenCalledWith({ where: { id: "R1" }, data: { introStatus: "cancelled" } });
    vi.clearAllMocks();
    prisma.relationship.findUnique.mockResolvedValue({ id: "R1", introStatus: "done", introTaskId: "T1" });
    await cancelIntroCall("i1", "b1");
    expect(prisma.task.updateMany).not.toHaveBeenCalled();
  });
});
