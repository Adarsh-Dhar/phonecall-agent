import { describe, it, expect, vi } from "vitest";

vi.mock("../../lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } }));
vi.mock("@workspace/db-prisma", () => ({ prisma: {} }));

import { reconcileTaskActions } from "../taskExtraction/reconcileTasks";

const NOW = new Date("2026-10-10T06:00:00Z");

function fakeTx(active: Array<{ id: string; title: string }> = [{ id: "t1", title: "Existing task" }]) {
  const task = {
    findMany: vi.fn().mockResolvedValue(active),
    create: vi.fn().mockImplementation(async ({ data }) => ({ id: "new1", googleEventId: null, ...data })),
    update: vi.fn().mockImplementation(async ({ where, data }) => ({ id: where.id, title: "Existing task", description: null, dueDate: data.dueDate ?? null, status: data.status ?? "open", googleEventId: null, ...data })),
  };
  const taskSourceMessage = { upsert: vi.fn() };
  return { tx: { task, taskSourceMessage } as any, task, taskSourceMessage };
}
const run = (tx: any, taskActions: any[]) =>
  reconcileTaskActions(tx, { taskActions, conversationId: "c1", contactId: "k1", contactName: "N", contactBusiness: null, deltaMessages: [{ id: "m1" }, { id: "m2" }], now: NOW });
const A = { confidence: 0.95, sourceMessageIds: ["m1"] };

describe("reconcileTaskActions", () => {
  it("hallucinated task ids are skipped, not applied or thrown", async () => {
    const { tx, task } = fakeTx();
    const r = await run(tx, [{ type: "complete", taskId: "nope", ...A }, { type: "cancel", taskId: "nope", ...A }, { type: "update", taskId: "nope", title: "x", ...A }]);
    expect(task.update).not.toHaveBeenCalled();
    expect(r.skipped).toHaveLength(3);
    expect(r.completed).toEqual([]);
  });

  it("complete/cancel/update below the action threshold or without a cited delta message are skipped", async () => {
    const { tx, task } = fakeTx();
    const r = await run(tx, [
      { type: "complete", taskId: "t1", confidence: 0.8, sourceMessageIds: ["m1"] },
      { type: "cancel", taskId: "t1", confidence: 0.95, sourceMessageIds: ["old-msg"] },
    ]);
    expect(task.update).not.toHaveBeenCalled();
    expect(r.skipped.map((s) => s.reason)).toEqual(["confidence below action threshold", "no cited message from the new messages"]);
  });

  it("complete and cancel apply; cancel uses the 'cancelled' source role", async () => {
    const { tx, task, taskSourceMessage } = fakeTx([{ id: "t1", title: "a" }, { id: "t2", title: "b" }]);
    const r = await run(tx, [{ type: "complete", taskId: "t1", ...A }, { type: "cancel", taskId: "t2", ...A }]);
    expect(r.completed).toEqual(["t1"]);
    expect(r.cancelled).toEqual(["t2"]);
    expect(task.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "t2" }, data: expect.objectContaining({ status: "cancelled" }) }));
    const roles = taskSourceMessage.upsert.mock.calls.map((c) => c[0].create.role);
    expect(roles).toEqual(["completed", "cancelled"]);
  });

  it("a bad dueDate drops only the date; the task is still created", async () => {
    const { tx, task } = fakeTx();
    const r = await run(tx, [{ type: "create", title: "Call vendor", dueDate: "2026-10-12T15:00:00", ...A }]);
    expect(r.created).toEqual(["new1"]);
    expect(task.create.mock.calls[0][0].data.dueDate).toBeNull();
    expect(r.tasksToSync).toHaveLength(0);
  });

  it("a valid dueDate with offset is stored and synced", async () => {
    const { tx, task } = fakeTx();
    const r = await run(tx, [{ type: "create", title: "Call vendor", dueDate: "2026-10-12T15:00:00+05:30", ...A }]);
    expect(task.create.mock.calls[0][0].data.dueDate.toISOString()).toBe("2026-10-12T09:30:00.000Z");
    expect(r.tasksToSync).toHaveLength(1);
  });

  it("empty title and duplicate-of-active-task creates are skipped", async () => {
    const { tx, task } = fakeTx();
    const r = await run(tx, [{ type: "create", title: "  ", ...A }, { type: "create", title: "existing  TASK", ...A }]);
    expect(task.create).not.toHaveBeenCalled();
    expect(r.skipped).toHaveLength(2);
  });

  it("update with only an invalid dueDate is skipped as a no-op instead of wiping the schedule", async () => {
    const { tx, task } = fakeTx();
    const r = await run(tx, [{ type: "update", taskId: "t1", dueDate: "tomorrow", ...A }]);
    expect(task.update).not.toHaveBeenCalled();
    expect(r.skipped[0].reason).toBe("nothing valid to update");
  });

  it("low-confidence create lands as 'suggested'", async () => {
    const { tx, task } = fakeTx();
    await run(tx, [{ type: "create", title: "Maybe", confidence: 0.5, sourceMessageIds: ["m1"] }]);
    expect(task.create.mock.calls[0][0].data.status).toBe("suggested");
  });
});
