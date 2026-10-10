import { describe, it, expect, vi } from 'vitest';
import { reconcileKnowledgeActions } from '../taskExtraction/reconcileKnowledge';
import type { KnowledgeAction } from '../taskExtraction/types';

type Row = Record<string, any>;

function fakeTx(existing: Row[] = []) {
  const rows = new Map<string, Row>(existing.map((r) => [r.key, { id: `id-${r.key}`, contactId: 'k1', ...r }]));
  const tx: any = {
    contactKnowledge: {
      findUnique: vi.fn(async ({ where }: any) => rows.get(where.contactId_key.key) ?? null),
      upsert: vi.fn(async ({ where, create, update }: any) => {
        const key = where.contactId_key.key;
        const row = rows.has(key) ? Object.assign(rows.get(key)!, update) : { id: `id-${key}`, ...create };
        rows.set(key, row);
        return row;
      }),
      update: vi.fn(async ({ where, data }: any) => Object.assign(rows.get(where.contactId_key.key)!, data)),
    },
    knowledgeSourceMessage: { upsert: vi.fn(async () => ({})) },
  };
  return { tx, rows };
}

const base = { contactId: 'k1', deltaMessages: [{ id: 'm1' }] };
const up = (a: Partial<KnowledgeAction>): KnowledgeAction =>
  ({ type: 'upsert', category: 'fact', key: 'hours', value: '9-5', confidence: 0.95, sourceMessageIds: ['m1'], ...a }) as KnowledgeAction;

describe('reconcileKnowledgeActions — upsert', () => {
  it('high confidence -> active', async () => {
    const { tx, rows } = fakeTx();
    const out = await reconcileKnowledgeActions(tx, { ...base, knowledgeActions: [up({})] });
    expect(rows.get('hours')!.status).toBe('active');
    expect(out.knowledgeUpserted).toHaveLength(1);
    expect(out.knowledgeSuggested).toHaveLength(0);
  });

  it('low confidence -> suggested, never active', async () => {
    const { tx, rows } = fakeTx();
    const out = await reconcileKnowledgeActions(tx, { ...base, knowledgeActions: [up({ confidence: 0.4 })] });
    expect(rows.get('hours')!.status).toBe('suggested');
    expect(out.knowledgeSuggested).toHaveLength(1);
    expect(out.knowledgeUpserted).toHaveLength(0);
  });

  it('a low-confidence upsert cannot overwrite an existing ACTIVE fact', async () => {
    const { tx, rows } = fakeTx([{ key: 'hours', value: '10-4', status: 'active', confidence: 1 }]);
    const out = await reconcileKnowledgeActions(tx, { ...base, knowledgeActions: [up({ confidence: 0.5, value: 'hallucinated' })] });
    expect(rows.get('hours')).toMatchObject({ value: '10-4', status: 'active' });
    expect(tx.contactKnowledge.upsert).not.toHaveBeenCalled();
    expect(out.skipped).toEqual([{ kind: 'knowledge', type: 'upsert', ref: 'hours', reason: 'would_overwrite_active_fact' }]);
  });

  it('a high-confidence upsert does update an active fact', async () => {
    const { tx, rows } = fakeTx([{ key: 'hours', value: '10-4', status: 'active', confidence: 1 }]);
    await reconcileKnowledgeActions(tx, { ...base, knowledgeActions: [up({ value: '9-6' })] });
    expect(rows.get('hours')).toMatchObject({ value: '9-6', status: 'active' });
  });

  it('a high-confidence upsert revives a stale fact; a low one leaves it only suggested', async () => {
    const a = fakeTx([{ key: 'hours', value: 'old', status: 'stale', confidence: 1 }]);
    await reconcileKnowledgeActions(a.tx, { ...base, knowledgeActions: [up({})] });
    expect(a.rows.get('hours')!.status).toBe('active');

    const b = fakeTx([{ key: 'hours', value: 'old', status: 'stale', confidence: 1 }]);
    await reconcileKnowledgeActions(b.tx, { ...base, knowledgeActions: [up({ confidence: 0.3 })] });
    expect(b.rows.get('hours')!.status).toBe('suggested');
  });

  it.each(['', '   ', 'x'.repeat(501)])('skips an unusable value (%#)', async (value) => {
    const { tx } = fakeTx();
    const out = await reconcileKnowledgeActions(tx, { ...base, knowledgeActions: [up({ value })] });
    expect(tx.contactKnowledge.upsert).not.toHaveBeenCalled();
    expect(out.skipped[0].reason).toBe('invalid_value');
  });

  it('only links source messages from this batch', async () => {
    const { tx } = fakeTx();
    await reconcileKnowledgeActions(tx, { ...base, knowledgeActions: [up({ sourceMessageIds: ['m1', 'elsewhere'] })] });
    expect(tx.knowledgeSourceMessage.upsert).toHaveBeenCalledTimes(1);
  });
});

describe('reconcileKnowledgeActions — invalidate', () => {
  const inv = (a: Partial<KnowledgeAction> = {}): KnowledgeAction =>
    ({ type: 'invalidate', category: 'fact', key: 'hours', confidence: 0.95, sourceMessageIds: ['m1'], ...a }) as KnowledgeAction;

  it('high confidence marks an active fact stale', async () => {
    const { tx, rows } = fakeTx([{ key: 'hours', value: '9-5', status: 'active' }]);
    const out = await reconcileKnowledgeActions(tx, { ...base, knowledgeActions: [inv()] });
    expect(rows.get('hours')!.status).toBe('stale');
    expect(out.knowledgeInvalidated).toEqual(['hours']);
  });

  it('low confidence cannot knock out an active fact', async () => {
    const { tx, rows } = fakeTx([{ key: 'hours', value: '9-5', status: 'active' }]);
    const out = await reconcileKnowledgeActions(tx, { ...base, knowledgeActions: [inv({ confidence: 0.4 })] });
    expect(rows.get('hours')!.status).toBe('active');
    expect(out.skipped[0].reason).toBe('low_confidence');
  });

  it('can drop a never-trusted suggested fact at any confidence', async () => {
    const { tx, rows } = fakeTx([{ key: 'hours', value: '9-5', status: 'suggested' }]);
    await reconcileKnowledgeActions(tx, { ...base, knowledgeActions: [inv({ confidence: 0.1 })] });
    expect(rows.get('hours')!.status).toBe('stale');
  });

  it('skips an unknown key', async () => {
    const { tx } = fakeTx();
    const out = await reconcileKnowledgeActions(tx, { ...base, knowledgeActions: [inv()] });
    expect(out.skipped[0].reason).toBe('unknown_fact');
  });
});
