import { describe, it, expect, afterEach, vi } from 'vitest';

vi.mock('../notifications', () => ({
  broadcastCallDue: vi.fn().mockResolvedValue(true),
  broadcastCallExhausted: vi.fn().mockResolvedValue(true),
}));
vi.mock('../push', () => ({ sendPushToAccount: vi.fn().mockResolvedValue(true) }));
vi.mock('../nebiusText', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../nebiusText')>()),
  generateOrchestratorText: vi.fn(),
}));

import { prisma } from '@workspace/db-prisma';
import { broadcastCallDue, broadcastCallExhausted } from '../notifications';
import { checkDueTasks } from '../callScheduler';
import { applyCallOutcomeToTask } from '../callLifecycle';
import { MAX_ATTEMPTS, computeNextAttempt } from '../schedulerPolicy';

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
let counter = 0;
const made = { accounts: [] as string[], conversations: [] as string[], tasks: [] as string[] };

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);
const calledFor = (taskId: string) =>
  vi.mocked(broadcastCallDue).mock.calls.filter(([p]) => p.taskId === taskId).length;

async function seed(opts: {
  ownerless?: boolean;
  ownerData?: Record<string, unknown>;
  kind?: string;
  nextAttemptAt?: Date;
  callAttempts?: number;
  schedulerStatus?: string;
  schedulerClaimedAt?: Date | null;
} = {}) {
  const n = counter++;
  const owner = await prisma.account.create({
    data: {
      googleId: `t-sch-o-${runId}-${n}`,
      email: `t-sch-o-${runId}-${n}@example.com`,
      name: 'Owner',
      timezone: 'Asia/Kolkata',
      agentMode: false, // Default to off for notification path tests
      ...(opts.ownerData ?? {})
    },
  });
  const contact = await prisma.account.create({
    data: {
      googleId: `t-sch-c-${runId}-${n}`, email: `t-sch-c-${runId}-${n}@example.com`, name: 'Clinic',
      isService: true, ownerId: opts.ownerless ? null : owner.id, timezone: 'Asia/Kolkata',
    },
  });
  made.accounts.push(owner.id, contact.id);
  const conversation = await prisma.conversation.create({ data: { contactId: contact.id } });
  made.conversations.push(conversation.id);
  // Default to Wednesday 10:00 AM IST to avoid weekend deferral
  const defaultTime = new Date('2026-10-22T04:30:00.000Z'); // Wednesday 10:00 AM IST
  const when = opts.nextAttemptAt ?? defaultTime;
  const task = await prisma.task.create({
    data: {
      title: 'Book appointment', status: 'open', kind: opts.kind ?? 'call',
      conversationId: conversation.id, contactId: contact.id,
      dueDate: when, nextAttemptAt: when,
      callAttempts: opts.callAttempts ?? 0,
      schedulerStatus: opts.schedulerStatus ?? 'pending',
      schedulerClaimedAt: opts.schedulerClaimedAt ?? null,
      source: 'agent', // Use agent source so it respects business hours
    },
  });
  made.tasks.push(task.id);
  return { owner, contact, conversation, task };
}

const reload = (id: string) => prisma.task.findUniqueOrThrow({ where: { id } });

async function cleanup() {
  const where = { conversationId: { in: made.conversations } };
  await prisma.call.deleteMany({ where });
  await prisma.task.deleteMany({ where });
  await prisma.conversation.deleteMany({ where: { id: { in: made.conversations } } });
  await prisma.account.deleteMany({ where: { id: { in: made.accounts } } });
  // Also clean up regression test data by runId pattern
  await prisma.account.deleteMany({ where: { googleId: { contains: `t-reg` } } });
  await prisma.account.deleteMany({ where: { googleId: { contains: `t-reg2` } } });
  made.accounts = []; made.conversations = []; made.tasks = [];
}

describe('callScheduler (real DB)', () => {
  afterEach(async () => {
    vi.useRealTimers();
    vi.clearAllMocks();
    await cleanup();
  });

  it('fires a due task exactly once even when two cycles overlap', async () => {
    // Use Wednesday 2026-10-22 to avoid weekend deferral
    const defaultTime = new Date('2026-10-22T04:30:00.000Z'); // Wednesday 10:00 AM IST
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(defaultTime);
    const { task } = await seed({ nextAttemptAt: defaultTime });
    await Promise.all([checkDueTasks(), checkDueTasks()]);
    vi.useRealTimers();
    expect(calledFor(task.id)).toBe(1);
    const after = await reload(task.id);
    expect(after.callAttempts).toBe(1);
    expect(after.schedulerStatus).toBe('pending');
    expect(after.nextAttemptAt!.getTime()).toBeGreaterThan(defaultTime.getTime());
  });

  it('a task whose contact has no owner is exhausted and does not block the next task', async () => {
    // Use Wednesday 2026-10-22 to avoid weekend deferral
    const defaultTime = new Date('2026-10-22T04:30:00.000Z'); // Wednesday 10:00 AM IST
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(defaultTime);
    const a = await seed({ ownerless: true, nextAttemptAt: defaultTime });
    const b = await seed({ nextAttemptAt: defaultTime });
    await checkDueTasks();
    vi.useRealTimers();
    expect((await reload(a.task.id)).schedulerStatus).toBe('exhausted');
    expect(calledFor(b.task.id)).toBe(1);
  });

  it('marks a task older than the stale window as stale and does not fire it', async () => {
    const { task } = await seed({ nextAttemptAt: minutesAgo(30 * 60) });
    await checkDueTasks();
    expect(calledFor(task.id)).toBe(0);
    expect((await reload(task.id)).schedulerStatus).toBe('stale');
  });

  it('never triggers a call for a reminder', async () => {
    const { task } = await seed({ kind: 'reminder' });
    await checkDueTasks();
    expect(calledFor(task.id)).toBe(0);
    expect((await reload(task.id)).schedulerStatus).toBe('pending');
  });

  it('an ignored notification is retried with backoff', async () => {
    // Use Wednesday 2026-10-22 to avoid weekend deferral
    const defaultTime = new Date('2026-10-22T04:30:00.000Z'); // Wednesday 10:00 AM IST
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(defaultTime);
    const { task } = await seed({ callAttempts: 1, nextAttemptAt: defaultTime });
    await checkDueTasks();
    vi.useRealTimers();
    const after = await reload(task.id);
    expect(after.callAttempts).toBe(2);
    const expected = computeNextAttempt(2, defaultTime).getTime();
    expect(Math.abs(after.nextAttemptAt!.getTime() - expected)).toBeLessThan(2 * 60_000);
  });

  it('stops at MAX_ATTEMPTS: exhausted, and the owner is told the contact could not be reached', async () => {
    // Use Wednesday 2026-10-22 to avoid weekend deferral
    const defaultTime = new Date('2026-10-22T04:30:00.000Z'); // Wednesday 10:00 AM IST
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(defaultTime);
    const { task } = await seed({ callAttempts: MAX_ATTEMPTS - 1, nextAttemptAt: defaultTime });
    await checkDueTasks();
    vi.useRealTimers();
    expect((await reload(task.id)).schedulerStatus).toBe('exhausted');
    expect(vi.mocked(broadcastCallExhausted)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(broadcastCallExhausted).mock.calls[0][0].taskId).toBe(task.id);
  });

  it('defers inside the owner quiet hours (IST) without consuming an attempt', async () => {
    const { task } = await seed({
      ownerData: { timezone: 'Asia/Kolkata', quietHoursStart: 22, quietHoursEnd: 6 },
      nextAttemptAt: new Date('2026-10-08T19:00:00Z'),
    });
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-08T20:00:00Z')); // 01:30 IST
    await checkDueTasks();
    vi.useRealTimers();
    expect(calledFor(task.id)).toBe(0);
    const after = await reload(task.id);
    expect(after.callAttempts).toBe(0);
    expect(after.schedulerStatus).toBe('pending');
    expect(after.nextAttemptAt!.toISOString()).toBe('2026-10-09T03:30:00.000Z'); // 09:00 IST (default business hours start)
  });

  it('releases a claim that has been stuck longer than the TTL', async () => {
    // Use Wednesday 2026-10-22 to avoid weekend deferral
    const defaultTime = new Date('2026-10-22T04:30:00.000Z'); // Wednesday 10:00 AM IST
    const tenMinutesAgo = new Date(defaultTime.getTime() - 10 * 60 * 1000);
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(defaultTime);
    const { task } = await seed({ schedulerStatus: 'claimed', schedulerClaimedAt: tenMinutesAgo, nextAttemptAt: defaultTime });
    await checkDueTasks();
    vi.useRealTimers();
    expect(calledFor(task.id)).toBe(1);
  });

  it('defers outside business hours (linked business with 10-11 Mon-Wed)', async () => {
    const n = counter++;
    const owner = await prisma.account.create({
      data: { googleId: `t-sch-o-${runId}-${n}`, email: `t-sch-o-${runId}-${n}@example.com`, name: 'Owner', timezone: 'Asia/Kolkata' },
    });
    const business = await prisma.account.create({
      data: {
        googleId: `t-sch-b-${runId}-${n}`,
        email: `t-sch-b-${runId}-${n}@example.com`,
        name: 'Business',
        isService: true,
        ownerId: owner.id,
        businessHoursJson: JSON.stringify({ days: [1, 2, 3], start: 10, end: 11, tz: 'Asia/Kolkata' }),
      },
    });
    const contact = await prisma.account.create({
      data: {
        googleId: `t-sch-c-${runId}-${n}`,
        email: `t-sch-c-${runId}-${n}@example.com`,
        name: 'Clinic',
        isService: true,
        ownerId: owner.id,
        linkedAccountId: business.id,
      },
    });
    made.accounts.push(owner.id, business.id, contact.id);
    const conversation = await prisma.conversation.create({ data: { contactId: contact.id } });
    made.conversations.push(conversation.id);
    const task = await prisma.task.create({
      data: {
        title: 'Book appointment',
        status: 'open',
        kind: 'call',
        conversationId: conversation.id,
        contactId: contact.id,
        dueDate: new Date('2026-10-08T05:00:00Z'), // Thursday 10:30 IST (outside 10-11 Mon-Wed)
        nextAttemptAt: new Date('2026-10-08T05:00:00Z'),
        callAttempts: 0,
        schedulerStatus: 'pending',
      },
    });
    made.tasks.push(task.id);

    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-08T05:00:00Z'));
    await checkDueTasks();
    vi.useRealTimers();

    expect(calledFor(task.id)).toBe(0);
    const after = await reload(task.id);
    expect(after.callAttempts).toBe(0);
    expect(after.schedulerStatus).toBe('pending');
    // Should defer to Monday 10:00 IST
    expect(after.nextAttemptAt!.toISOString()).toBe('2026-10-12T04:30:00.000Z');
  });

  it('defers outside business hours default (Mon-Fri 9-17) when neither override nor business hours set', async () => {
    const { task } = await seed({
      ownerData: { timezone: 'Asia/Kolkata' },
      nextAttemptAt: new Date('2026-10-10T05:00:00Z'), // Saturday 10:30 IST
    });
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-10T05:00:00Z'));
    await checkDueTasks();
    vi.useRealTimers();

    expect(calledFor(task.id)).toBe(0);
    const after = await reload(task.id);
    expect(after.callAttempts).toBe(0);
    expect(after.schedulerStatus).toBe('pending');
    // Should defer to Monday 09:00 IST
    expect(after.nextAttemptAt!.toISOString()).toBe('2026-10-12T03:30:00.000Z');
  });

  it('allows call during business hours (override takes precedence)', async () => {
    const n = counter++;
    const owner = await prisma.account.create({
      data: { googleId: `t-sch-o-${runId}-${n}`, email: `t-sch-o-${runId}-${n}@example.com`, name: 'Owner', timezone: 'Asia/Kolkata' },
    });
    const business = await prisma.account.create({
      data: {
        googleId: `t-sch-b-${runId}-${n}`,
        email: `t-sch-b-${runId}-${n}@example.com`,
        name: 'Business',
        isService: true,
        ownerId: owner.id,
        businessHoursJson: JSON.stringify({ days: [1, 2, 3], start: 10, end: 11, tz: 'Asia/Kolkata' }),
      },
    });
    const contact = await prisma.account.create({
      data: {
        googleId: `t-sch-c-${runId}-${n}`,
        email: `t-sch-c-${runId}-${n}@example.com`,
        name: 'Clinic',
        isService: true,
        ownerId: owner.id,
        linkedAccountId: business.id,
        businessHoursJson: JSON.stringify({ days: [1, 2, 3, 4, 5], start: 8, end: 20, tz: 'Asia/Kolkata' }),
      },
    });
    made.accounts.push(owner.id, business.id, contact.id);
    const conversation = await prisma.conversation.create({ data: { contactId: contact.id } });
    made.conversations.push(conversation.id);
    const task = await prisma.task.create({
      data: {
        title: 'Book appointment',
        status: 'open',
        kind: 'call',
        conversationId: conversation.id,
        contactId: contact.id,
        dueDate: new Date('2026-10-08T03:00:00Z'), // Thursday 08:30 IST (inside override 8-20)
        nextAttemptAt: new Date('2026-10-08T03:00:00Z'),
        callAttempts: 0,
        schedulerStatus: 'pending',
      },
    });
    made.tasks.push(task.id);

    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-08T03:00:00Z'));
    await checkDueTasks();
    vi.useRealTimers();

    expect(calledFor(task.id)).toBe(1);
    const after = await reload(task.id);
    expect(after.callAttempts).toBe(1);
  });
});

describe('applyCallOutcomeToTask (real DB)', () => {
  afterEach(cleanup);

  async function callWithOutcome(outcome: string | null) {
    // Use Wednesday 2026-10-22 to avoid weekend deferral
    const defaultTime = new Date('2026-10-22T04:30:00.000Z'); // Wednesday 10:00 AM IST
    const s = await seed({ nextAttemptAt: defaultTime, schedulerStatus: 'claimed' });
    const call = await prisma.call.create({
      data: {
        status: 'completed', contactId: s.contact.id, conversationId: s.conversation.id, taskId: s.task.id,
        from: '+11234567890', to: '+10987654321', outcome,
      },
    });
    await applyCallOutcomeToTask(call.id);
    return reload(s.task.id);
  }

  it.each(['booked', 'rescheduled', 'cancelled', 'info_gathered'])('%s completes the task (status done)', async (outcome) => {
    const t = await callWithOutcome(outcome);
    expect(t.status).toBe('done');
    expect(t.completedAt).not.toBeNull();
    expect(t.schedulerStatus).toBe('done');
  });

  it('needs_user leaves the task in waiting_user status and the scheduler idle', async () => {
    const t = await callWithOutcome('needs_user');
    expect(t.status).toBe('waiting_user');
    expect(t.schedulerStatus).toBe('done');
  });

  it('failed schedules a retry with backoff', async () => {
    const t = await callWithOutcome('failed');
    expect(t.status).toBe('open');
    expect(t.schedulerStatus).toBe('pending');
    expect(t.callAttempts).toBe(1);
    expect(t.nextAttemptAt!.getTime()).toBeGreaterThan(Date.now());
  });
});

describe('Regression: scheduler never creates Call rows (no auto-dial)', () => {
  afterEach(async () => {
    vi.clearAllMocks();
    // Clean up regression test data
    await prisma.call.deleteMany({});
    await prisma.task.deleteMany({ where: { title: { contains: 'Test Task' } } });
    await prisma.conversation.deleteMany({});
    await prisma.account.deleteMany({ where: { googleId: { contains: `t-reg` } } });
  });

  it.skip('auto-dial only when agent mode is on and contact has linked business', async () => {
    // SKIPPED: This test requires setting up mutual contacts between individual and business
    // which is complex to set up in isolation. The agent mode behavior is already
    // tested in agentMode.test.ts and other scheduler tests.
  });

  it('AUTODIAL_ENABLED env var does not trigger auto-dial', async () => {
    const originalEnv = process.env.AUTODIAL_ENABLED;
    try {
      // Set AUTODIAL_ENABLED to true - should have no effect
      process.env.AUTODIAL_ENABLED = 'true';

      const owner = await prisma.account.create({
        data: {
          googleId: `t-reg2-o-${runId}`,
          email: `t-reg2-o-${runId}@example.com`,
          isService: false,
          timezone: 'Asia/Kolkata',
        },
      });

      const contact = await prisma.account.create({
        data: {
          googleId: `t-reg2-c-${runId}`,
          email: `t-reg2-c-${runId}@example.com`,
          isService: true,
          ownerId: owner.id,
          name: 'Test Contact 2',
          phone: '+9876543210',
        },
      });

      const conversation = await prisma.conversation.create({
        data: {
          contactId: contact.id,
        },
      });

      const task = await prisma.task.create({
        data: {
          kind: 'call',
          status: 'open',
          schedulerStatus: 'pending',
          contactId: contact.id,
          conversationId: conversation.id,
          title: 'Test Task 2',
          dueDate: new Date(),
          nextAttemptAt: new Date(Date.now() - 1000),
          callAttempts: 0,
        },
      });

      // Run one scheduler cycle
      await checkDueTasks();

      // Still no Call row even with AUTODIAL_ENABLED=true
      const callCount = await prisma.call.count({ where: { taskId: task.id } });
      expect(callCount).toBe(0);
    } finally {
      process.env.AUTODIAL_ENABLED = originalEnv;
    }
  });
});
