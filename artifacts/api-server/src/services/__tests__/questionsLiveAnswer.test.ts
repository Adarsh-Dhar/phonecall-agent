import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@workspace/db-prisma';
import { handleQueryAnswered } from '../../routes/questions';
import { resolveLiveQuery } from '../liveEscalation';

describe('questions live answer with real DB', () => {
  const testId = Date.now().toString();
  let callId: string;
  let taskId: string;
  let queryId: string;
  let conversationId: string;
  let contactId: string;

  beforeAll(async () => {
    // Verify we're using a test database
    const dbUrl = process.env.DATABASE_URL || process.env.TEST_DATABASE_URL;
    if (!dbUrl?.includes('test')) {
      throw new Error('Tests must run against a test database (DATABASE_URL or TEST_DATABASE_URL must contain "test")');
    }

    // Create test data
    const contact = await prisma.account.create({
      data: {
        googleId: `test-contact-live-answer-${testId}`,
        email: `contact-${testId}@example.com`,
        name: 'Test Contact',
        isService: true,
      },
    });
    contactId = contact.id;

    const conversation = await prisma.conversation.create({
      data: {
        contactId: contact.id,
      },
    });
    conversationId = conversation.id;

    const task = await prisma.task.create({
      data: {
        title: 'Test Task',
        status: 'completed',
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
        knowledgeKey: 'price',
        knowledgeCategory: 'fact',
      },
    });
    queryId = query.id;
  });

  afterAll(async () => {
    // Cleanup only the test data we created
    await prisma.query.deleteMany({ where: { id: queryId } });
    await prisma.task.deleteMany({ where: { id: taskId } });
    await prisma.call.deleteMany({ where: { id: callId } });
    await prisma.conversation.deleteMany({ where: { id: conversationId } });
    await prisma.account.deleteMany({ where: { googleId: `test-contact-live-answer-${testId}` } });
  });

  it('after the call ended, answering creates the callback task and reopens the original task', async () => {
    const query = await prisma.query.findUnique({ where: { id: queryId } });
    expect(query).not.toBeNull();

    await handleQueryAnswered(query!, '$50');

    // The callback task should be created
    const callbackTasks = await prisma.task.findMany({
      where: {
        title: { contains: 'Call back with answer' },
        conversationId: conversationId,
      },
    });

    expect(callbackTasks.length).toBeGreaterThan(0);
    expect(callbackTasks[0].status).toBe('open');
    expect(callbackTasks[0].priority).toBe('high');
    expect(callbackTasks[0].description).toContain('$50');

    // The original task should be reopened
    const originalTask = await prisma.task.findUnique({ where: { id: taskId } });
    expect(originalTask?.status).toBe('open');

    // The fact should be saved in ContactKnowledge
    const knowledge = await prisma.contactKnowledge.findUnique({
      where: {
        contactId_key: {
          contactId: contactId,
          key: 'price',
        },
      },
    });
    expect(knowledge).not.toBeNull();
    expect(knowledge?.value).toBe('$50');
  });

  it('when call is in-progress, resolving live query does not create callback task', async () => {
    // Create another call that's in-progress
    const inProgressCall = await prisma.call.create({
      data: {
        status: 'in-progress',
        contactId: contactId,
        conversationId: conversationId,
        from: '+11234567890',
        to: '+10987654321',
        startedAt: new Date(),
      },
    });

    const inProgressQuery = await prisma.query.create({
      data: {
        question: 'What is the availability?',
        status: 'pending',
        conversationId: conversationId,
        contactId: contactId,
        callId: inProgressCall.id,
        isKnowledgeGap: true,
        urgent: true,
        knowledgeKey: 'availability',
        knowledgeCategory: 'fact',
      },
    });

    // Resolve the live query (simulating user answering during call)
    const resolved = resolveLiveQuery(inProgressQuery.id, '9am-5pm');
    expect(resolved).toBe(true);

    // Wait a bit for any async operations
    await new Promise(resolve => setTimeout(resolve, 100));

    // No callback task should be created
    const callbackTasks = await prisma.task.findMany({
      where: {
        title: { contains: 'Call back with answer' },
        conversationId: conversationId,
      },
    });

    // Only the previous callback task should exist, not a new one
    expect(callbackTasks.length).toBe(1);

    // Cleanup
    await prisma.query.delete({ where: { id: inProgressQuery.id } });
    await prisma.call.delete({ where: { id: inProgressCall.id } });
  });
});
