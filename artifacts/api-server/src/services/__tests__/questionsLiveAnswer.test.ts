import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '@workspace/db-prisma';

describe('questions live answer with real DB', () => {
  let callId: string;
  let taskId: string;
  let queryId: string;

  beforeAll(async () => {
    // Create test data
    const contact = await prisma.account.create({
      data: {
        googleId: 'test-contact-live-answer',
        email: 'contact@example.com',
        name: 'Test Contact',
        isService: true,
      },
    });

    const owner = await prisma.account.create({
      data: {
        googleId: 'test-owner-live-answer',
        email: 'owner@example.com',
        name: 'Test Owner',
        isService: false,
      },
    });

    const conversation = await prisma.conversation.create({
      data: {
        contactId: contact.id,
      },
    });

    const task = await prisma.task.create({
      data: {
        title: 'Test Task',
        status: 'open',
        conversationId: conversation.id,
        contactId: contact.id,
      },
    });
    taskId = task.id;

    const call = await prisma.call.create({
      data: {
        status: 'completed',
        contactId: contact.id,
        conversationId: conversation.id,
        taskId: task.id,
        from: '+11234567890',
        to: '+10987654321',
        startedAt: new Date(),
        endedAt: new Date(),
      },
    });
    callId = call.id;

    const query = await prisma.query.create({
      data: {
        question: 'What is the price?',
        status: 'pending',
        conversationId: conversation.id,
        contactId: contact.id,
        callId: call.id,
        isKnowledgeGap: true,
        urgent: true,
      },
    });
    queryId = query.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.query.deleteMany({ where: { callId } });
    await prisma.call.deleteMany({ where: { id: callId } });
    await prisma.task.deleteMany({ where: { id: taskId } });
    await prisma.conversation.deleteMany({ where: {} });
    await prisma.account.deleteMany({ where: { googleId: { in: ['test-contact-live-answer', 'test-owner-live-answer'] } } });
  });

  it('after the call ended, answering creates the callback task and reopens the original task', async () => {
    // Simulate answering the query after the call has ended
    await prisma.query.update({
      where: { id: queryId },
      data: {
        status: 'answered',
        answer: '$50',
      },
    });

    // The callback task should be created
    const callbackTasks = await prisma.task.findMany({
      where: {
        title: { contains: 'Call back with answer' },
        conversationId: (await prisma.query.findUnique({ where: { id: queryId } }))!.conversationId,
      },
    });

    expect(callbackTasks.length).toBeGreaterThan(0);
    expect(callbackTasks[0].status).toBe('open');
    expect(callbackTasks[0].priority).toBe('high');

    // The original task should be reopened
    const originalTask = await prisma.task.findUnique({ where: { id: taskId } });
    expect(originalTask?.status).toBe('open');
  });
});
