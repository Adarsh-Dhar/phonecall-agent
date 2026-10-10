import { describe, it, expect, vi } from 'vitest';
import { reconcileTaskActions, parseModelDueDate } from '../taskExtraction/reconcileTasks';
import type { TaskAction } from '../taskExtraction/types';

const NOW = new Date('2026-10-10T08:00:00.000Z');
const IN_2_DAYS = '2026-10-12T15:00:00+05:30';

type Row = Record<string, any>;

/** Minimal in-memory stand-in for the Prisma transaction client. */
function fakeTx(existing: Row[] = []) {
  const rows = new Map<string, Row>(existing.map((r) => [r.id, { ...r }]));
  let n = 0;
  const tx: any = {
    task: {
      create: vi.fn(async ({ data }: any) => {
        const row = { id: `new-${++n}`, googleEventId: null, ...data };
        rows.set(row.id, row);
        return row;
      }),
      findFirst: vi.fn(async ({ where }: any) => {
        const r = rows.get(where.id);
        if (!r) return null;
        if (where.conversationId && r.conversationId !== where.conversationId) return null;
        if (where.status?.in && !where.status.in.includes(r.status)) return null;
        return r;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const r = rows.get(where.id)!;
        Object.assign(r, data);
        return r;
      }),
    },
    taskSourceMessage: { upsert: vi.fn(async () => ({})) },
  };
  return { tx, rows };
}

const base = {
  conversationId: 'c1',
  contactId: 'k1',
  contactName: 'Clinic',
  contactBusiness: null,
  deltaMessages: [{ id: 'm1' }, { id: 'm2' }],
  now: NOW,
};

const task = (over: Row = {}): Row => ({
  id: 't1',
  title: 'Call back',
  description: null,
  status: 'open',
  conversationId: 'c1',
  dueDate: new Date(IN_2_DAYS),
  googleEventId: 'ev1',
  ...over,
});

const act = (a: Partial<TaskAction>): TaskAction =>
  ({ type: 'create', confidence: 0.95, sourceMessageIds: ['m1'], ...a }) as TaskAction;

describe('parseModelDueDate', () => {
  it.each([
    ['2026-10-12', 'date only (no time)'],
    ['next tuesday 3pm', 'not parseable'],
    ['2026-10-10T07:00:00Z', 'in the past'],
    ['2028-01-01T10:00:00Z', 'beyond the 365-day horizon'],
    [undefined, 'missing'],
    [12345, 'not a string'],
  ])('rejects %s (%s)', (v) => {
    expect(parseModelDueDate(v as any, NOW)).toBeNull();
  });
  it('accepts a future date with a time', () => {
    expect(parseModelDueDate(IN_2_DAYS, NOW)).toBeInstanceOf(Date);
  });
});

describe('reconcileTaskActions — create', () => {
  it('high confidence + valid due date -> open, scheduler armed, calendar sync queued', async () => {
    const { tx } = fakeTx();
    const out = await reconcileTaskActions(tx, { ...base, taskActions: [act({ title: 'Book', dueDate: IN_2_DAYS })] });
    const data = tx.task.create.mock.calls[0][0].data;
    expect(data.status).toBe('open');
    expect(data.nextAttemptAt).toEqual(new Date(IN_2_DAYS));
    expect(out.tasksToSync).toHaveLength(1);
  });

  it('low confidence -> suggested and NOT synced to Calendar', async () => {
    const { tx } = fakeTx();
    const out = await reconcileTaskActions(tx, {
      ...base,
      taskActions: [act({ title: 'Maybe', dueDate: IN_2_DAYS, confidence: 0.5 })],
    });
    expect(tx.task.create.mock.calls[0][0].data.status).toBe('suggested');
    expect(out.tasksToSync).toHaveLength(0);
    expect(out.created).toHaveLength(1);
  });

  it.each(['2026-10-12', '2020-01-01T10:00:00Z', 'garbage'])('drops an unusable dueDate (%s) but still creates the task', async (d) => {
    const { tx } = fakeTx();
    const out = await reconcileTaskActions(tx, { ...base, taskActions: [act({ title: 'x', dueDate: d })] });
    const data = tx.task.create.mock.calls[0][0].data;
    expect(data.dueDate).toBeNull();
    expect(data.nextAttemptAt).toBeNull();
    expect(out.skipped).toEqual([{ kind: 'task', type: 'create', reason: 'invalid_due_date' }]);
    expect(out.tasksToSync).toHaveLength(0);
  });
});

describe('reconcileTaskActions — complete / cancel', () => {
  it.each(['complete', 'cancel'] as const)('%s at high confidence with a cited message is applied', async (type) => {
    const { tx, rows } = fakeTx([task()]);
    const out = await reconcileTaskActions(tx, { ...base, taskActions: [act({ type, taskId: 't1' })] });
    expect(rows.get('t1')!.status).toBe(type === 'complete' ? 'done' : 'cancelled');
    expect(rows.get('t1')!.schedulerStatus).toBe('done');
    expect(out.tasksToSync).toHaveLength(1); // had a calendar event
  });

  it.each(['complete', 'cancel'] as const)('%s below the action threshold is skipped, not applied', async (type) => {
    const { tx, rows } = fakeTx([task()]);
    const out = await reconcileTaskActions(tx, { ...base, taskActions: [act({ type, taskId: 't1', confidence: 0.8 })] });
    expect(rows.get('t1')!.status).toBe('open');
    expect(tx.task.update).not.toHaveBeenCalled();
    expect(out.skipped).toEqual([{ kind: 'task', type, ref: 't1', reason: 'low_confidence' }]);
    expect(out.completed.concat(out.cancelled)).toHaveLength(0);
  });

  it('is skipped when it cites no message from this batch', async () => {
    const { tx, rows } = fakeTx([task()]);
    const out = await reconcileTaskActions(tx, {
      ...base,
      taskActions: [act({ type: 'complete', taskId: 't1', sourceMessageIds: ['not-in-batch'] })],
    });
    expect(rows.get('t1')!.status).toBe('open');
    expect(out.skipped[0].reason).toBe('no_source_message');
  });

  it('skips a taskId from another conversation, an already-done task, and a nonexistent one', async () => {
    const { tx } = fakeTx([
      task({ id: 'other', conversationId: 'c2' }),
      task({ id: 'done', status: 'done' }),
    ]);
    const out = await reconcileTaskActions(tx, {
      ...base,
      taskActions: [
        act({ type: 'cancel', taskId: 'other' }),
        act({ type: 'complete', taskId: 'done' }),
        act({ type: 'complete', taskId: 'ghost' }),
      ],
    });
    expect(tx.task.update).not.toHaveBeenCalled();
    expect(out.skipped.map((s) => s.reason)).toEqual(['unknown_task', 'unknown_task', 'unknown_task']);
  });

  it('records the cancel source link with role "cancelled"', async () => {
    const { tx } = fakeTx([task()]);
    await reconcileTaskActions(tx, { ...base, taskActions: [act({ type: 'cancel', taskId: 't1' })] });
    expect(tx.taskSourceMessage.upsert.mock.calls[0][0].create.role).toBe('cancelled');
  });
});

describe('reconcileTaskActions — update', () => {
  it('confident reschedule re-arms the scheduler and queues a calendar sync', async () => {
    const { tx, rows } = fakeTx([task()]);
    const out = await reconcileTaskActions(tx, {
      ...base,
      taskActions: [act({ type: 'update', taskId: 't1', dueDate: '2026-10-14T10:00:00Z', confidence: 0.95 })],
    });
    expect(rows.get('t1')!.nextAttemptAt).toEqual(new Date('2026-10-14T10:00:00Z'));
    expect(rows.get('t1')!.schedulerStatus).toBe('pending');
    expect(out.tasksToSync).toHaveLength(1);
  });

  it('low-confidence reschedule is ignored but other fields still apply', async () => {
    const { tx, rows } = fakeTx([task()]);
    const out = await reconcileTaskActions(tx, {
      ...base,
      taskActions: [act({ type: 'update', taskId: 't1', title: 'New title', dueDate: '2026-10-14T10:00:00Z', confidence: 0.7 })],
    });
    expect(rows.get('t1')!.title).toBe('New title');
    expect(rows.get('t1')!.nextAttemptAt).toBeUndefined();
    expect(out.tasksToSync).toHaveLength(0);
    expect(out.skipped[0].reason).toBe('low_confidence');
  });

  it('an invalid dueDate no longer throws (Invalid Date used to abort the whole transaction)', async () => {
    const { tx } = fakeTx([task()]);
    await expect(
      reconcileTaskActions(tx, { ...base, taskActions: [act({ type: 'update', taskId: 't1', dueDate: 'garbage' })] })
    ).resolves.toBeTruthy();
  });

  it('does not push a suggested task to Calendar on reschedule', async () => {
    const { tx } = fakeTx([task({ status: 'suggested' })]);
    const out = await reconcileTaskActions(tx, {
      ...base,
      taskActions: [act({ type: 'update', taskId: 't1', dueDate: '2026-10-14T10:00:00Z' })],
    });
    expect(out.tasksToSync).toHaveLength(0);
  });
});
