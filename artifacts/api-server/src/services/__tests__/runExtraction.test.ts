import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } }));
vi.mock("../googleCalendar", () => ({ syncTaskToCalendar: vi.fn().mockResolvedValue(undefined) }));
vi.mock("../taskExtraction/autoEnd", () => ({ checkAndAutoEndConversation: vi.fn() }));

const hoisted = vi.hoisted(() => {
  const msgs = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `m${i + 1}`, role: i % 2 ? "assistant" : "user", content: `c${i}`, time: "Now", callId: "call1" as string | null, createdAt: new Date(2026, 9, 10, 10, 0, i) }));
  return {
    state: { cursor: null as string | null, messages: msgs(2) },
    msgs,
    prisma: {} as any,
    callModel: vi.fn(),
  };
});

vi.mock("@workspace/db-prisma", () => ({ prisma: hoisted.prisma }));
vi.mock("../taskExtraction/orchestratorPrompt", () => ({ callOrchestratorExtraction: hoisted.callModel }));

import { runExtraction } from "../taskExtraction/runExtraction";
import { NebiusError } from "../nebiusText";

const { state, prisma, callModel } = hoisted;

function wire() {
  prisma.conversation = {
    findUnique: vi.fn().mockImplementation(async () => ({ id: "c1", contactId: "k1", lastExtractedMessageId: state.cursor, contact: { name: "N", business: null, ownerId: "o1", isService: true } })),
    update: vi.fn().mockImplementation(async ({ data }) => { state.cursor = data.lastExtractedMessageId; }),
  };
  prisma.account = { findUnique: vi.fn().mockResolvedValue({ id: "o1", timezone: "Asia/Kolkata" }) };
  prisma.message = {
    findUnique: vi.fn().mockImplementation(async ({ where }) => state.messages.find((m) => m.id === where.id) ?? null),
    findMany: vi.fn().mockImplementation(async ({ where, take }) => {
      const since = where.createdAt?.gt as Date | undefined;
      return state.messages.filter((m) => !since || m.createdAt > since).slice(0, take);
    }),
  };
  prisma.task = { findMany: vi.fn().mockResolvedValue([]) };
  prisma.contactKnowledge = { findMany: vi.fn().mockResolvedValue([{ key: "k", category: "fact", value: "v" }]) };
  prisma.$transaction = vi.fn().mockImplementation(async (fn: any) => fn(prisma));
}

beforeEach(() => {
  process.env.NEBIUS_API_KEY = "k";
  state.cursor = null;
  state.messages = hoisted.msgs(2);
  callModel.mockReset();
  wire();
});

describe("runExtraction", () => {
  it("labels speakers by callId/role and passes known facts to the model", async () => {
    callModel.mockResolvedValue({ taskActions: [], knowledgeActions: [], dropped: 0 });
    await runExtraction("c1");
    const ctx = callModel.mock.calls[0][1];
    expect(ctx.newMessages.map((m: any) => m.speaker)).toEqual(["contact", "agent"]);
    expect(ctx.existingKnowledge).toEqual([{ key: "k", category: "fact", value: "v" }]);
    expect(state.cursor).toBe("m2");
  });

  it("app-chat 'user' rows are the owner, not the contact", async () => {
    state.messages = state.messages.map((m) => ({ ...m, callId: null }));
    callModel.mockResolvedValue({ taskActions: [], knowledgeActions: [], dropped: 0 });
    await runExtraction("c1");
    expect(callModel.mock.calls[0][1].newMessages[0].speaker).toBe("owner");
  });

  it("two overlapping runs never call the model concurrently; the second becomes a queued re-run", async () => {
    let release!: () => void;
    callModel.mockImplementationOnce(() => new Promise((res) => { release = () => res({ taskActions: [], knowledgeActions: [], dropped: 0 }); }));
    callModel.mockResolvedValue({ taskActions: [], knowledgeActions: [], dropped: 0 });

    const first = runExtraction("c1");
    await vi.waitFor(() => expect(callModel).toHaveBeenCalledTimes(1));
    state.messages = hoisted.msgs(4); // new messages arrive mid-run
    const second = await runExtraction("c1");
    expect(second.created).toEqual([]);
    expect(callModel).toHaveBeenCalledTimes(1); // no concurrent run
    release();
    await first;
    expect(callModel).toHaveBeenCalledTimes(2); // re-run picked up the new messages from the moved cursor
    expect(callModel.mock.calls[1][1].newMessages.map((m: any) => m.id)).toEqual(["m3", "m4"]);
    expect(state.cursor).toBe("m4");
  });

  it("an unreadable model reply leaves the cursor in place; a poison delta is skipped after 3 failures", async () => {
    callModel.mockRejectedValue(new SyntaxError("garbage"));
    await runExtraction("c1");
    await runExtraction("c1");
    expect(state.cursor).toBeNull();
    await runExtraction("c1");
    expect(state.cursor).toBe("m2"); // skipped so it can't block forever
  });

  it("outages / rate limits / bad keys never count toward skipping a delta", async () => {
    callModel.mockRejectedValue(new NebiusError("rate limited", 429, true));
    for (let i = 0; i < 5; i++) await runExtraction("c1");
    callModel.mockRejectedValue(new NebiusError("unauthorized", 401, false));
    for (let i = 0; i < 5; i++) await runExtraction("c1");
    expect(state.cursor).toBeNull();
  });

  it("if another instance moved the cursor while the model was thinking, nothing is written", async () => {
    callModel.mockImplementation(async () => {
      state.cursor = "m2"; // someone else extracted meanwhile
      return { taskActions: [{ type: "create", title: "dup", confidence: 0.9, sourceMessageIds: ["m1"] }], knowledgeActions: [], dropped: 0 };
    });
    prisma.task.create = vi.fn();
    const r = await runExtraction("c1");
    expect(prisma.task.create).not.toHaveBeenCalled();
    expect(r.created).toEqual([]);
  });
});
