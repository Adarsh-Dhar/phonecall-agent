import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@workspace/db-prisma';
import { getTaskContextForCall } from '../voiceStreamService';

describe('task briefing with taskId', () => {
  const testId = Date.now().toString();
  let contactId: string;
  let conversationId: string;
  let taskAId: string;
  let taskBId: string;

  beforeAll(async () => {
    const contact = await prisma.account.create({
      data: {
        googleId: `test-contact-briefing-${testId}`,
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

    // Create task A (older)
    const taskA = await prisma.task.create({
      data: {
        title: 'Schedule Appointment',
        status: 'open',
        conversationId: conversation.id,
        contactId: contact.id,
        createdAt: new Date('2026-01-01'),
      },
    });
    taskAId = taskA.id;

    // Create task B (newer)
    const taskB = await prisma.task.create({
      data: {
        title: 'Follow up on invoice',
        status: 'open',
        conversationId: conversation.id,
        contactId: contact.id,
        createdAt: new Date('2026-01-02'),
      },
    });
    taskBId = taskB.id;
  });

  afterAll(async () => {
    await prisma.task.deleteMany({ where: { id: { in: [taskAId, taskBId] } } });
    await prisma.conversation.deleteMany({ where: { id: conversationId } });
    await prisma.account.deleteMany({ where: { googleId: `test-contact-briefing-${testId}` } });
  });

  it('a call with taskId = A briefs task A even when task B is newer', async () => {
    // When call.taskId is set to task A, getTaskContextForCall should return task A
    const taskContext = await getTaskContextForCall(taskAId, contactId);

    expect(taskContext).not.toBeNull();
    expect(taskContext?.title).toBe('Schedule Appointment');
  });

  it('a call with taskId = B briefs task B', async () => {
    // When call.taskId is set to task B, getTaskContextForCall should return task B
    const taskContext = await getTaskContextForCall(taskBId, contactId);

    expect(taskContext).not.toBeNull();
    expect(taskContext?.title).toBe('Follow up on invoice');
  });

  it('a call with no taskId returns null', async () => {
    const taskContext = await getTaskContextForCall(null, contactId);
    expect(taskContext).toBeNull();
  });

  it('a call with invalid taskId returns null', async () => {
    const taskContext = await getTaskContextForCall('invalid-task-id', contactId);
    expect(taskContext).toBeNull();
  });
});
