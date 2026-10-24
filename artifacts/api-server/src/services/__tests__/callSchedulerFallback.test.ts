import { describe, it, expect, afterEach, vi } from 'vitest';

vi.mock('../notifications', () => ({
  broadcastCallDue: vi.fn().mockResolvedValue(true),
  broadcastCallExhausted: vi.fn().mockResolvedValue(true),
  broadcastTaskDue: vi.fn().mockResolvedValue(true),
}));
vi.mock('../push', () => ({ sendPushToAccount: vi.fn().mockResolvedValue(true) }));
vi.mock('../agentCallTools', () => ({ agentPlaceCall: vi.fn() }));
vi.mock('../outbound', () => ({
  notifyOwnerFallback: vi.fn().mockResolvedValue({ channel: 'none', delivered: false }),
  messageBusinessFallback: vi.fn().mockResolvedValue({ channel: 'email', delivered: true }),
}));

import { prisma } from '@workspace/db-prisma';
import { broadcastCallExhausted } from '../notifications';
import { agentPlaceCall } from '../agentCallTools';
import { notifyOwnerFallback, messageBusinessFallback } from '../outbound';
import { checkDueTasks } from '../callScheduler';
import { MAX_ATTEMPTS } from '../schedulerPolicy';

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
let counter = 0;
const made = { accounts: [] as string[], conversations: [] as string[] };
const WED_10_IST = new Date('2026-10-22T04:30:00.000Z');

async function seed(opts: { agentMode: boolean; callAttempts: number; schedulerStatus?: string; nextAttemptAt?: Date | null }) {
  const n = counter++;
  const owner = await prisma.account.create({
    data: { googleId: `t-fb-o-${runId}-${n}`, email: `t-fb-o-${runId}-${n}@example.com`, name: 'Owner', timezone: 'Asia/Kolkata', agentMode: opts.agentMode },
  });
  const business = await prisma.account.create({
    data: { googleId: `t-fb-b-${runId}-${n}`, email: `t-fb-b-${runId}-${n}@example.com`, name: 'Business', isService: true, timezone: 'Asia/Kolkata' },
  });
  const contact = await prisma.account.create({
    data: { googleId: `t-fb-c-${runId}-${n}`, name: 'Clinic', isService: true, ownerId: owner.id, linkedAccountId: business.id, timezone: 'Asia/Kolkata' },
  });
  made.accounts.push(owner.id, business.id, contact.id);
  const conversation = await prisma.conversation.create({ data: { contactId: contact.id } });
  made.conversations.push(conversation.id);
  const exhausted = opts.schedulerStatus === 'exhausted';
  const task = await prisma.task.create({
    data: {
      title: 'Book checkup', status: 'open', kind: 'call', source: 'agent',
      conversationId: conversation.id, contactId: contact.id, dueDate: WED_10_IST,
      nextAttemptAt: exhausted ? null : (opts.nextAttemptAt === undefined ? WED_10_IST : opts.nextAttemptAt),
      callAttempts: opts.callAttempts, schedulerStatus: opts.schedulerStatus ?? 'pending',
    },
  });
  return { owner, business, contact, conversation, task };
}

async function cycle(at = WED_10_IST) {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(at);
  try { await checkDueTasks(); } finally { vi.useRealTimers(); }
}

afterEach(async () => {
  vi.clearAllMocks();
  const where = { conversationId: { in: made.conversations } };
  await prisma.call.deleteMany({ where });
  await prisma.task.deleteMany({ where });
  await prisma.conversation.deleteMany({ where: { id: { in: made.conversations } } });
  await prisma.account.deleteMany({ where: { id: { in: made.accounts } } });
  made.accounts = []; made.conversations = [];
});

describe('business fallback wiring (real DB)', () => {
  it('final attempt, business offline: owner is told and the opted-in business is messaged once', async () => {
    vi.mocked(agentPlaceCall).mockResolvedValue({ kind: 'missed', callId: 'x' });
    const { task, owner, contact } = await seed({ agentMode: true, callAttempts: MAX_ATTEMPTS - 1 });
    await cycle();
    expect((await prisma.task.findUniqueOrThrow({ where: { id: task.id } })).schedulerStatus).toBe('exhausted');
    expect(broadcastCallExhausted).toHaveBeenCalledTimes(1);
    expect(messageBusinessFallback).toHaveBeenCalledTimes(1);
    expect(vi.mocked(messageBusinessFallback).mock.calls[0][0]).toEqual({
      ownerId: owner.id, contactId: contact.id, taskId: task.id, taskTitle: 'Book checkup', attempts: MAX_ATTEMPTS,
    });
    // A later cycle must not repeat it.
    await cycle(new Date(WED_10_IST.getTime() + 3600e3));
    expect(messageBusinessFallback).toHaveBeenCalledTimes(1);
  });

  it('owner email still goes out when push and tabs are unreachable', async () => {
    vi.mocked(agentPlaceCall).mockResolvedValue({ kind: 'missed', callId: 'x' });
    vi.mocked(broadcastCallExhausted).mockResolvedValueOnce(false);
    const { task } = await seed({ agentMode: true, callAttempts: MAX_ATTEMPTS - 1 });
    await cycle();
    expect(notifyOwnerFallback).toHaveBeenCalledTimes(1);
    expect(vi.mocked(notifyOwnerFallback).mock.calls[0][1]).toMatchObject({ taskId: task.id, url: `/tasks/${task.id}` });
  });

  it('a non-final miss does not message the business', async () => {
    vi.mocked(agentPlaceCall).mockResolvedValue({ kind: 'missed', callId: 'x' });
    const { task } = await seed({ agentMode: true, callAttempts: 0 });
    await cycle();
    expect((await prisma.task.findUniqueOrThrow({ where: { id: task.id } })).schedulerStatus).toBe('pending');
    expect(messageBusinessFallback).not.toHaveBeenCalled();
    expect(broadcastCallExhausted).not.toHaveBeenCalled();
  });

  it('agent mode off: the owner is the caller, so the business is left alone', async () => {
    await seed({ agentMode: false, callAttempts: MAX_ATTEMPTS - 1 });
    await cycle();
    expect(agentPlaceCall).not.toHaveBeenCalled();
    expect(broadcastCallExhausted).toHaveBeenCalledTimes(1);
    expect(messageBusinessFallback).not.toHaveBeenCalled();
  });

  it('final attempt rings: nothing yet; once the ring times out unanswered, owner and business are told exactly once', async () => {
    vi.mocked(agentPlaceCall).mockImplementation(async (i) => {
      const t = await prisma.task.findUniqueOrThrow({ where: { id: i.taskId! }, include: { contact: true } });
      const call = await prisma.call.create({
        data: { status: 'ringing', ringingAt: WED_10_IST, from: 'a', to: 'b', conversationId: t.conversationId, contactId: t.contactId, taskId: t.id, placedByAgent: true },
      });
      return { kind: 'ringing', callId: call.id };
    });
    const { task } = await seed({ agentMode: true, callAttempts: MAX_ATTEMPTS - 1 });
    await cycle();
    expect((await prisma.task.findUniqueOrThrow({ where: { id: task.id } })).schedulerStatus).toBe('exhausted');
    expect(broadcastCallExhausted).not.toHaveBeenCalled();
    expect(messageBusinessFallback).not.toHaveBeenCalled();

    await cycle(new Date(WED_10_IST.getTime() + 10 * 60e3)); // ring timeout passed
    expect((await prisma.call.findFirstOrThrow({ where: { taskId: task.id } })).status).toBe('missed');
    expect(broadcastCallExhausted).toHaveBeenCalledTimes(1);
    expect(messageBusinessFallback).toHaveBeenCalledTimes(1);

    await cycle(new Date(WED_10_IST.getTime() + 20 * 60e3));
    expect(messageBusinessFallback).toHaveBeenCalledTimes(1);
  });

  it('a ring that times out before the attempts are used up announces nothing', async () => {
    const { task, conversation, contact } = await seed({ agentMode: true, callAttempts: 2, schedulerStatus: 'pending', nextAttemptAt: new Date(WED_10_IST.getTime() + 6 * 3600e3) });
    await prisma.call.create({ data: { status: 'ringing', ringingAt: WED_10_IST, from: 'a', to: 'b', conversationId: conversation.id, contactId: contact.id, taskId: task.id, placedByAgent: true } });
    await cycle(new Date(WED_10_IST.getTime() + 10 * 60e3));
    expect(messageBusinessFallback).not.toHaveBeenCalled();
    expect(broadcastCallExhausted).not.toHaveBeenCalled();
  });

  it('an older call timing out is ignored when a newer call exists; calls not placed by the agent are ignored', async () => {
    const a = await seed({ agentMode: true, callAttempts: MAX_ATTEMPTS, schedulerStatus: 'exhausted' });
    const old = await prisma.call.create({ data: { status: 'ringing', ringingAt: WED_10_IST, from: 'a', to: 'b', conversationId: a.conversation.id, contactId: a.contact.id, taskId: a.task.id, placedByAgent: true } });
    await new Promise((r) => setTimeout(r, 15));
    await prisma.call.create({ data: { status: 'initiated', from: 'a', to: 'b', conversationId: a.conversation.id, contactId: a.contact.id, taskId: a.task.id, placedByAgent: true } });
    const b = await seed({ agentMode: true, callAttempts: MAX_ATTEMPTS, schedulerStatus: 'exhausted' });
    await prisma.call.create({ data: { status: 'ringing', ringingAt: WED_10_IST, from: 'a', to: 'b', conversationId: b.conversation.id, contactId: b.contact.id, taskId: b.task.id, placedByAgent: false } });
    await cycle(new Date(WED_10_IST.getTime() + 10 * 60e3));
    expect((await prisma.call.findUniqueOrThrow({ where: { id: old.id } })).status).toBe('missed');
    expect(messageBusinessFallback).not.toHaveBeenCalled();
  });
});
