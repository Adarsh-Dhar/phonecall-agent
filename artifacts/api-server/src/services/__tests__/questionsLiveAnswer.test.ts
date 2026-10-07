import { describe, it, expect, afterAll, vi } from 'vitest';

vi.mock('../presence', () => ({ sendToAccount: vi.fn().mockReturnValue(true) }));
vi.mock('../push', () => ({ sendPushToAccount: vi.fn().mockResolvedValue(undefined) }));

import { prisma } from '@workspace/db-prisma';
import { handleQueryAnswered } from '../../routes/questions';
import { askUserDuringCall } from '../liveEscalation';

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const created = { accounts: [] as string[], conversations: [] as string[] };

async function seed(callStatus: 'completed' | 'in-progress') {
  const n = created.accounts.length;
  const contact = await prisma.account.create({
    data: { googleId: `t-live-${runId}-${n}`, email: `t-live-${runId}-${n}@example.com`, name: 'Test Contact', isService: true },
  });
  created.accounts.push(contact.id);
  const conversation = await prisma.conversation.create({ data: { contactId: contact.id } });
  created.conversations.push(conversation.id);
  const task = await prisma.task.create({
    data: { title: 'Book dentist', status: callStatus === 'completed' ? 'completed' : 'open', conversationId: conversation.id, contactId: contact.id },
  });
  const call = await prisma.call.create({
    data: {
      status: callStatus,
      contactId: contact.id,
      conversationId: conversation.id,
      taskId: task.id,
      from: '+11234567890',
      to: '+10987654321',
      startedAt: new Date(),
      endedAt: callStatus === 'completed' ? new Date() : null,
    },
  });
  return { contact, conversation, task, call };
}

const callbackTasks = (taskId: string) =>
  prisma.task.count({ where: { parentTaskId: taskId, title: { startsWith: 'Call back with answer' } } });

describe('handleQueryAnswered with a real DB', () => {
  afterAll(async () => {
    // Only rows created by this run.
    const where = { conversationId: { in: created.conversations } };
    await prisma.task.deleteMany({ where: { ...where, parentTaskId: { not: null } } });
    await prisma.contactKnowledge.deleteMany({ where: { contactId: { in: created.accounts } } });
    await prisma.query.deleteMany({ where });
    await prisma.task.deleteMany({ where });
    await prisma.message.deleteMany({ where });
    await prisma.call.deleteMany({ where });
    await prisma.conversation.deleteMany({ where: { id: { in: created.conversations } } });
    await prisma.account.deleteMany({ where: { id: { in: created.accounts } } });
  });

  it('after the call ended: saves the fact, creates the callback task, reopens the original task', async () => {
    const { contact, conversation, task, call } = await seed('completed');
    const query = await prisma.query.create({
      data: {
        question: 'What is the price?', status: 'pending', conversationId: conversation.id, contactId: contact.id,
        callId: call.id, isKnowledgeGap: true, urgent: true, knowledgeKey: 'price', knowledgeCategory: 'fact',
      },
    });

    await handleQueryAnswered(query, '$50');

    expect(await callbackTasks(task.id)).toBe(1);
    const callback = await prisma.task.findFirst({ where: { parentTaskId: task.id } });
    expect(callback?.status).toBe('open');
    expect(callback?.priority).toBe('high');
    expect(callback?.description).toContain('$50');

    const original = await prisma.task.findUnique({ where: { id: task.id } });
    expect(original?.status).toBe('open');
    expect(original?.callTriggeredAt).toBeNull();

    const fact = await prisma.contactKnowledge.findUnique({ where: { contactId_key: { contactId: contact.id, key: 'price' } } });
    expect(fact?.value).toBe('$50');
  });

  it('during the call: the waiting ask_user gets the answer and no callback task is created', async () => {
    const { contact, conversation, task, call } = await seed('in-progress');

    const asked = askUserDuringCall({
      callId: call.id, conversationId: conversation.id, contactId: contact.id, ownerId: contact.id,
      question: 'What is the availability?', knowledgeKey: 'availability', knowledgeCategory: 'fact',
    });

    const query = await vi.waitFor(async () => {
      const q = await prisma.query.findFirst({ where: { callId: call.id } });
      expect(q).not.toBeNull();
      return q!;
    });

    const before = await callbackTasks(task.id);
    await handleQueryAnswered(query, '9am-5pm');

    expect(await asked).toBe('9am-5pm');
    expect(await callbackTasks(task.id)).toBe(before);
    expect(before).toBe(0);

    const original = await prisma.task.findUnique({ where: { id: task.id } });
    expect(original?.status).toBe('open'); // untouched, still in progress
    const fact = await prisma.contactKnowledge.findUnique({ where: { contactId_key: { contactId: contact.id, key: 'availability' } } });
    expect(fact?.value).toBe('9am-5pm');
  });
});
