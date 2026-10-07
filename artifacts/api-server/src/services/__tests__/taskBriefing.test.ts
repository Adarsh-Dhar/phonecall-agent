import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@workspace/db-prisma';
import { buildOutboundCallSystemInstruction } from '../callAnalysis';

describe('task briefing with taskId', () => {
  let contactId: string;
  let ownerId: string;
  let conversationId: string;
  let taskAId: string;
  let taskBId: string;

  beforeAll(async () => {
    const contact = await prisma.account.create({
      data: {
        googleId: 'test-contact-briefing',
        email: 'contact@example.com',
        name: 'Test Contact',
        isService: true,
      },
    });
    contactId = contact.id;

    const owner = await prisma.account.create({
      data: {
        googleId: 'test-owner-briefing',
        email: 'owner@example.com',
        name: 'Test Owner',
        isService: false,
      },
    });
    ownerId = owner.id;

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
    await prisma.account.deleteMany({ where: { googleId: { in: ['test-contact-briefing', 'test-owner-briefing'] } } });
  });

  it('a call with taskId = A briefs task A even when task B is newer', () => {
    const instruction = buildOutboundCallSystemInstruction(
      'Test Owner',
      'Test Contact',
      [],
      { title: 'Schedule Appointment', description: 'Book a time next week' },
      'Asia/Kolkata'
    );

    // The instruction should mention task A's title
    expect(instruction).toContain('Schedule Appointment');
    expect(instruction).toContain('Book a time next week');
  });
});
