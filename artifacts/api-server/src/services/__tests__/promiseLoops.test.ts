import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } }));

const { prisma } = vi.hoisted(() => ({ prisma: {
  account: { findUnique: vi.fn() },
  openLoop: { findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
  task: { create: vi.fn() },
} }));
vi.mock("@workspace/db-prisma", () => ({ prisma }));

import { parsePromises, createLoopsFromPromises } from "../memory/promiseLoops";

const NOW = new Date("2026-10-26T06:00:00Z");

describe("parsePromises", () => {
  it("maps business -> awaiting_business, agent -> commitment, drops junk", () => {
    const r = parsePromises(
      [
        { by: "business", what: "Call back with the quote", dueAt: "2026-10-30T10:00:00+05:30" },
        { by: "agent", what: "Send the ID copy", dueAt: "2026-10-28" },
        { by: "nobody", what: "ignored" },
        { by: "business", what: "x" },
        "garbage",
      ],
      NOW,
      "Asia/Kolkata",
    );
    expect(r.map((p) => p.kind)).toEqual(["awaiting_business", "commitment"]);
    expect(r[0].dueAt?.toISOString()).toBe("2026-10-30T04:30:00.000Z");
    expect(r[1].dueAt?.toISOString()).toBe("2026-10-28T12:30:00.000Z"); // 18:00 IST
  });

  it("keeps the promise but drops an unparseable or past date", () => {
    const r = parsePromises(
      [{ by: "business", what: "Will call Friday", dueAt: "Friday" }, { by: "business", what: "Old promise", dueAt: "2026-01-01" }],
      NOW,
      "UTC",
    );
    expect(r).toHaveLength(2);
    expect(r.every((p) => p.dueAt === null)).toBe(true);
  });

  it("returns [] for non-arrays", () => {
    expect(parsePromises(undefined, NOW, "UTC")).toEqual([]);
  });
});

describe("createLoopsFromPromises", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prisma.account.findUnique.mockResolvedValue({ timezone: "UTC" });
    prisma.openLoop.findMany.mockResolvedValue([]);
    prisma.openLoop.create.mockImplementation(async ({ data }: any) => ({ id: "L1", ...data }));
    prisma.task.create.mockResolvedValue({ id: "T1" });
  });
  const base = { relationshipId: "r1", callId: "c1", conversationId: "cv1", contactId: "k1", ownerId: "o1", now: NOW };

  it("creates a loop for a business promise and no task", async () => {
    const n = await createLoopsFromPromises({ ...base, promises: [{ by: "business", what: "Call back", dueAt: "2026-10-30T10:00:00Z" }] });
    expect(n).toBe(1);
    expect(prisma.openLoop.create.mock.calls[0][0].data.kind).toBe("awaiting_business");
    expect(prisma.task.create).not.toHaveBeenCalled();
  });

  it("creates a reminder task for our own dated promise and links it", async () => {
    await createLoopsFromPromises({ ...base, promises: [{ by: "agent", what: "Send documents", dueAt: "2026-10-30T10:00:00Z" }] });
    expect(prisma.task.create.mock.calls[0][0].data.kind).toBe("reminder");
    expect(prisma.openLoop.update).toHaveBeenCalledWith({ where: { id: "L1" }, data: { followUpTaskId: "T1" } });
  });

  it("skips a promise that already has an open loop", async () => {
    prisma.openLoop.findMany.mockResolvedValue([{ kind: "awaiting_business", text: "Call  back!" }]);
    const n = await createLoopsFromPromises({ ...base, promises: [{ by: "business", what: "call back", dueAt: null }] });
    expect(n).toBe(0);
    expect(prisma.openLoop.create).not.toHaveBeenCalled();
  });
});
