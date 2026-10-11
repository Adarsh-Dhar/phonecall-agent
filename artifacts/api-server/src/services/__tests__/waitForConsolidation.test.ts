import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const hoisted = vi.hoisted(() => ({ findFirst: vi.fn() }));
vi.mock("@workspace/db-prisma", () => ({ prisma: { call: { findFirst: hoisted.findFirst } } }));
vi.mock("../../lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } }));
vi.mock("../memory/relationship", () => ({ getOrCreateRelationship: vi.fn() }));

import { waitForConsolidation } from "../memory/briefing";

describe("waitForConsolidation", () => {
  beforeEach(() => { vi.useFakeTimers(); hoisted.findFirst.mockReset(); });
  afterEach(() => vi.useRealTimers());

  it("returns immediately when no earlier call is waiting", async () => {
    hoisted.findFirst.mockResolvedValue(null);
    await expect(waitForConsolidation("c1", "now", 4000)).resolves.toBe(true);
    expect(hoisted.findFirst).toHaveBeenCalledTimes(1);
  });

  it("only looks at ended calls with transcript rows that are not consolidated yet", async () => {
    hoisted.findFirst.mockResolvedValue(null);
    await waitForConsolidation("c1", "now", 4000);
    const where = hoisted.findFirst.mock.calls[0][0].where;
    expect(where).toMatchObject({ contactId: "c1", id: { not: "now" }, status: "completed", consolidatedAt: null, messages: { some: {} } });
  });

  it("waits, then returns true as soon as the previous call is consolidated", async () => {
    hoisted.findFirst.mockResolvedValueOnce({ id: "old" }).mockResolvedValueOnce({ id: "old" }).mockResolvedValue(null);
    const p = waitForConsolidation("c1", "now", 4000);
    await vi.advanceTimersByTimeAsync(600);
    await expect(p).resolves.toBe(true);
  });

  it("gives up at the deadline and returns false (caller falls back to the raw tail)", async () => {
    hoisted.findFirst.mockResolvedValue({ id: "old" });
    const p = waitForConsolidation("c1", "now", 4000);
    await vi.advanceTimersByTimeAsync(4500);
    await expect(p).resolves.toBe(false);
    expect(hoisted.findFirst.mock.calls.length).toBeLessThanOrEqual(17);
  });

  it("does not wait at all when the budget is 0", async () => {
    await expect(waitForConsolidation("c1", "now", 0)).resolves.toBe(false);
    expect(hoisted.findFirst).not.toHaveBeenCalled();
  });

  it("a database error never blocks the call", async () => {
    hoisted.findFirst.mockRejectedValue(new Error("db down"));
    await expect(waitForConsolidation("c1", "now", 4000)).resolves.toBe(true);
  });
});
