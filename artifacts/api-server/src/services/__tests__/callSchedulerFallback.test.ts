import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } }));

const { prisma } = vi.hoisted(() => ({ prisma: {
  account: { findUnique: vi.fn() },
  openLoop: { findMany: vi.fn() },
  task: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  call: { findFirst: vi.fn(), findMany: vi.fn(), updateMany: vi.fn() },
} }));
vi.mock("@workspace/db-prisma", () => ({ prisma }));

vi.mock("../notifications", () => ({
  broadcastCallExhausted: vi.fn(),
  broadcastTaskDue: vi.fn(),
}));

vi.mock("../outbound", () => ({
  notifyOwnerFallback: vi.fn(),
  messageBusinessFallback: vi.fn(),
}));

vi.mock("../memory/loopSweeper", () => ({ sweepOverdueLoops: vi.fn() }));

import { broadcastCallExhausted } from "../notifications";
import { notifyOwnerFallback, messageBusinessFallback } from "../outbound";
import { checkDueTasks } from "../callScheduler";
import { MAX_ATTEMPTS } from "../schedulerPolicy";

const NOW = new Date("2026-10-27T10:00:00Z");

describe("callScheduler business fallback wiring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    prisma.task.updateMany.mockResolvedValue({ count: 0 });
    prisma.openLoop.findMany.mockResolvedValue([]);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("final attempt: broadcasts call exhausted, then falls back to email for owner and messages business if agent called", async () => {
    prisma.task.findUnique.mockResolvedValue({
      id: "t1",
      title: "Book checkup",
      contactId: "c1",
      callAttempts: MAX_ATTEMPTS,
      schedulerStatus: "exhausted",
      contact: { ownerId: "o1", name: "Clinic" },
    } as any);
    prisma.task.update.mockResolvedValue({} as any);
    prisma.call.findMany.mockResolvedValue([]);
    broadcastCallExhausted.mockResolvedValue(false);
    notifyOwnerFallback.mockResolvedValue({ channel: "email", delivered: true });
    messageBusinessFallback.mockResolvedValue({ channel: "whatsapp", delivered: true });

    await checkDueTasks();

    expect(broadcastCallExhausted).toHaveBeenCalledWith({
      type: "call_exhausted",
      taskId: "t1",
      contactId: "c1",
      contactName: "Clinic",
      title: "Book checkup",
      attempts: MAX_ATTEMPTS,
      ownerId: "o1",
    });
    expect(notifyOwnerFallback).toHaveBeenCalledWith("o1", {
      subject: "Couldn't reach Clinic",
      text: expect.stringContaining("Book checkup"),
      url: "/tasks/t1",
      taskId: "t1",
    });
    expect(messageBusinessFallback).toHaveBeenCalledWith({
      ownerId: "o1",
      contactId: "c1",
      taskId: "t1",
      taskTitle: "Book checkup",
      attempts: MAX_ATTEMPTS,
    });
  });

  it("owner reminder: only owner fallback, never business", async () => {
    prisma.task.findUnique.mockResolvedValue({
      id: "t1",
      title: "Reminder",
      contactId: "c1",
      callAttempts: 0,
      schedulerStatus: "pending",
      kind: "reminder",
      dueDate: NOW,
      contact: { ownerId: "o1", name: "Clinic" },
    } as any);
    prisma.task.update.mockResolvedValue({} as any);
    prisma.call.findMany.mockResolvedValue([]);
    broadcastCallExhausted.mockResolvedValue(false);
    notifyOwnerFallback.mockResolvedValue({ channel: "email", delivered: true });

    await checkDueTasks();

    expect(notifyOwnerFallback).toHaveBeenCalledWith("o1", {
      subject: "Reminder: Reminder",
      text: expect.any(String),
      url: "/tasks/t1",
      taskId: "t1",
    });
    expect(messageBusinessFallback).not.toHaveBeenCalled();
  });

  it("non-final attempt: no fallback yet", async () => {
    prisma.task.findUnique.mockResolvedValue({
      id: "t1",
      title: "Book checkup",
      contactId: "c1",
      callAttempts: 1,
      schedulerStatus: "pending",
      contact: { ownerId: "o1", name: "Clinic" },
    } as any);
    prisma.task.update.mockResolvedValue({} as any);
    prisma.call.findMany.mockResolvedValue([]);

    await checkDueTasks();

    expect(broadcastCallExhausted).not.toHaveBeenCalled();
    expect(notifyOwnerFallback).not.toHaveBeenCalled();
    expect(messageBusinessFallback).not.toHaveBeenCalled();
  });

  it("stale ringing call: marks as missed and triggers fallback if it was the final agent call", async () => {
    prisma.call.findMany.mockResolvedValue([
      { id: "call1", taskId: "t1", placedByAgent: true, individualId: "o1", businessId: "c1" },
    ]);
    prisma.call.updateMany.mockResolvedValue({ count: 1 });
    prisma.task.findUnique.mockResolvedValue({
      id: "t1",
      title: "Book checkup",
      contactId: "c1",
      callAttempts: MAX_ATTEMPTS,
      schedulerStatus: "exhausted",
      contact: { ownerId: "o1", name: "Clinic" },
    } as any);
    prisma.call.findFirst.mockResolvedValue({ id: "call1" });
    prisma.task.update.mockResolvedValue({} as any);
    broadcastCallExhausted.mockResolvedValue(false);
    notifyOwnerFallback.mockResolvedValue({ channel: "email", delivered: true });
    messageBusinessFallback.mockResolvedValue({ channel: "whatsapp", delivered: true });

    await checkDueTasks();

    expect(prisma.call.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["call1"] } },
      data: { status: "missed" },
    });
    expect(messageBusinessFallback).toHaveBeenCalled();
  });

  it("older call timing out is ignored when a newer call exists", async () => {
    prisma.call.findMany.mockResolvedValue([
      { id: "call1", taskId: "t1", placedByAgent: true },
    ]);
    prisma.call.updateMany.mockResolvedValue({ count: 1 });
    prisma.task.findUnique.mockResolvedValue({
      id: "t1",
      title: "Book checkup",
      contactId: "c1",
      callAttempts: MAX_ATTEMPTS,
      schedulerStatus: "exhausted",
      contact: { ownerId: "o1", name: "Clinic" },
    } as any);
    prisma.call.findFirst.mockResolvedValue({ id: "call2" }); // newer call
    prisma.task.update.mockResolvedValue({} as any);

    await checkDueTasks();

    expect(messageBusinessFallback).not.toHaveBeenCalled();
  });

  it("call not placed by agent: owner is notified but business is not messaged", async () => {
    prisma.task.findUnique.mockResolvedValue({
      id: "t1",
      title: "Book checkup",
      contactId: "c1",
      callAttempts: MAX_ATTEMPTS,
      schedulerStatus: "exhausted",
      contact: { ownerId: "o1", name: "Clinic" },
    } as any);
    prisma.task.update.mockResolvedValue({} as any);
    prisma.call.findMany.mockResolvedValue([]);
    broadcastCallExhausted.mockResolvedValue(false);
    notifyOwnerFallback.mockResolvedValue({ channel: "email", delivered: true });

    await checkDueTasks();

    expect(notifyOwnerFallback).toHaveBeenCalled();
    expect(messageBusinessFallback).not.toHaveBeenCalled();
  });
});
