import { describe, it, expect, afterAll, beforeEach, vi } from 'vitest';

vi.mock('../nebiusText', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../nebiusText')>()),
  generateOrchestratorText: vi.fn(),
}));

import { prisma } from '@workspace/db-prisma';
import { generateOrchestratorText } from '../nebiusText';
import { analyzeCallForEscalation } from '../callAnalysis';

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const created = { accounts: [] as string[], conversations: [] as string[] };

async function seedCall() {
  const n = created.accounts.length;
  const contact = await prisma.account.create({
    data: { googleId: `t-an-${runId}-${n}`, email: `t-an-${runId}-${n}@example.com`, name: 'Test Clinic', isService: true },
  });
  created.accounts.push(contact.id);
  const conversation = await prisma.conversation.create({ data: { contactId: contact.id } });
  created.conversations.push(conversation.id);
  const call = await prisma.call.create({
    data: { status: 'completed', contactId: contact.id, conversationId: conversation.id, from: '+11234567890', to: '+10987654321', startedAt: new Date(), endedAt: new Date() },
  });
  await prisma.message.create({
    data: { role: 'user', content: 'We need a deposit.', time: '10:00', conversationId: conversation.id, callId: call.id },
  });
  return { contact, conversation, call };
}

describe('analyzeCallForEscalation with a real DB', () => {
  beforeEach(() => vi.mocked(generateOrchestratorText).mockReset());

  afterAll(async () => {
    const where = { conversationId: { in: created.conversations } };
    await prisma.query.deleteMany({ where });
    await prisma.message.deleteMany({ where });
    await prisma.call.deleteMany({ where });
    await prisma.conversation.deleteMany({ where: { id: { in: created.conversations } } });
    await prisma.account.deleteMany({ where: { id: { in: created.accounts } } });
  });

  it('parse failure on both attempts escalates for manual review (one pending query)', async () => {
    const { call } = await seedCall();
    vi.mocked(generateOrchestratorText).mockResolvedValue({ text: 'not json' } as any);

    await analyzeCallForEscalation(call.id);

    expect(generateOrchestratorText).toHaveBeenCalledTimes(2); // retried once
    const after = await prisma.call.findUnique({ where: { id: call.id } });
    expect(after?.isEnoughKnowledge).toBe(false);
    const queries = await prisma.query.findMany({ where: { callId: call.id } });
    expect(queries).toHaveLength(1);
    expect(queries[0].status).toBe('pending');
    expect(queries[0].question).toMatch(/review the transcript/i);
  });

  it('a reply missing isEnoughKnowledge counts as a failed parse, not "enough knowledge"', async () => {
    const { call } = await seedCall();
    vi.mocked(generateOrchestratorText).mockResolvedValue({ text: JSON.stringify({ outcome: 'booked' }) } as any);

    await analyzeCallForEscalation(call.id);

    expect(generateOrchestratorText).toHaveBeenCalledTimes(2);
    const after = await prisma.call.findUnique({ where: { id: call.id } });
    expect(after?.isEnoughKnowledge).toBe(false);
  });

  it('a fenced JSON reply is parsed and the speakers/task goal are sent to the model', async () => {
    const { call } = await seedCall();
    vi.mocked(generateOrchestratorText).mockResolvedValue({
      text: '`json\n{"isEnoughKnowledge": true, "outcome": "info_gathered"}\n`',
    } as any);

    await analyzeCallForEscalation(call.id);

    expect(generateOrchestratorText).toHaveBeenCalledTimes(1);
    const arg = vi.mocked(generateOrchestratorText).mock.calls[0][0];
    expect(arg.turns[0].content).toContain('CONTACT: We need a deposit.');
    const after = await prisma.call.findUnique({ where: { id: call.id } });
    expect(after?.isEnoughKnowledge).toBe(true);
    expect(after?.outcome).toBe('info_gathered');
  });

  it('an existing live query for the call prevents a duplicate post-call query', async () => {
    const { call, contact, conversation } = await seedCall();
    await prisma.query.create({
      data: {
        question: 'Can we pay a deposit?', status: 'pending', conversationId: conversation.id, contactId: contact.id,
        callId: call.id, isKnowledgeGap: true, urgent: true, knowledgeKey: 'deposit', knowledgeCategory: 'fact',
      },
    });

    await analyzeCallForEscalation(call.id);

    expect(generateOrchestratorText).not.toHaveBeenCalled();
    expect(await prisma.query.count({ where: { callId: call.id } })).toBe(1);
    const after = await prisma.call.findUnique({ where: { id: call.id } });
    expect(after?.isEnoughKnowledge).toBe(false);
  });

  it('when the model says more input is needed, one query is created', async () => {
    const { call } = await seedCall();
    vi.mocked(generateOrchestratorText).mockResolvedValue({
      text: JSON.stringify({ isEnoughKnowledge: false, escalationQuestion: 'Accept a Rs 500 deposit?', knowledgeKey: 'deposit-ok', knowledgeCategory: 'fact', outcome: 'needs_user' }),
    } as any);

    await analyzeCallForEscalation(call.id);

    expect(await prisma.query.count({ where: { callId: call.id } })).toBe(1);
    const after = await prisma.call.findUnique({ where: { id: call.id } });
    expect(after?.isEnoughKnowledge).toBe(false);
    expect(after?.outcome).toBe('needs_user');
  });
});
