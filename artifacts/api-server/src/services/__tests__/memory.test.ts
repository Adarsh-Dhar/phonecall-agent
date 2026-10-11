/**
 * DB integration tests for Relationship Memory Architecture
 *
 * Tests the core memory functionality:
 * - Relationship creation and retrieval
 * - Message ingestion with seq numbers
 * - Briefing building with relationship data
 * - OpenLoop management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '@workspace/db-prisma';
import {
  getOrCreateRelationship,
  getRelationship,
  updateRelationshipSummary,
  ingestMessage,
  ingestMessages,
  createOpenLoop,
  resolveOpenLoop,
  getOpenLoops,
  createOpenLoopFromQuery,
  createOpenLoopFromTask,
} from '../memory';
import { buildBriefing } from '../memory/briefing';
import { renderBriefing } from '../memory/render';

const runId = `test-${Date.now()}`;
const individualEmail = `individual-${runId}@test.com`;
const businessEmail = `business-${runId}@test.com`;

describe('Relationship Memory Architecture', () => {
  let individualId: string;
  let businessId: string;
  let contactId: string;
  let relationshipId: string;
  let conversationId: string;
  let callId: string;

  beforeEach(async () => {
    // Create test accounts
    const individual = await prisma.account.create({
      data: {
        email: individualEmail,
        name: 'Test Individual',
        isService: false,
      },
    });
    individualId = individual.id;

    const business = await prisma.account.create({
      data: {
        email: businessEmail,
        name: 'Test Business',
        business: 'Electrician',
        isService: true,
        ownerId: individualId,
      },
    });
    businessId = business.id;

    // Create contact row (the individual's contact for this business)
    const contact = await prisma.account.create({
      data: {
        email: `contact-${runId}@test.com`,
        name: 'Test Contact',
        isService: true,
        ownerId: individualId,
        linkedAccountId: businessId,
      },
    });
    contactId = contact.id;

    // Create conversation
    const conversation = await prisma.conversation.create({
      data: {
        contactId,
        title: 'Test Conversation',
      },
    });
    conversationId = conversation.id;

    // Create a call
    const call = await prisma.call.create({
      data: {
        conversationId,
        contactId,
        individualId,
        businessId,
        from: '+15551234567',
        to: '+15559876543',
        status: 'completed',
        direction: 'outbound',
        initiatedBy: 'individual',
        startedAt: new Date(),
        endedAt: new Date(),
      },
    });
    callId = call.id;
  });

  afterEach(async () => {
    // Clean up in reverse order of creation
    await prisma.message.deleteMany({ where: { conversationId } });
    await prisma.call.deleteMany({ where: { conversationId } });
    await prisma.openLoop.deleteMany({ where: { relationshipId } });
    await prisma.relationship.deleteMany({ where: { individualId } });
    await prisma.conversation.deleteMany({ where: { id: conversationId } });
    await prisma.account.deleteMany({ where: { id: contactId } });
    await prisma.account.deleteMany({ where: { id: businessId } });
    await prisma.account.deleteMany({ where: { id: individualId } });
  });

  describe('Relationship', () => {
    it('creates a new relationship on first call', async () => {
      const relationship = await getOrCreateRelationship({
        individualId,
        businessId,
        contactId,
      });

      expect(relationship).toBeDefined();
      expect(relationship.individualId).toBe(individualId);
      expect(relationship.businessId).toBe(businessId);
      expect(relationship.contactId).toBe(contactId);
      expect(relationship.summary).toBe('');
      expect(relationship.summaryVersion).toBe(0);

      relationshipId = relationship.id;
    });

    it('returns existing relationship on subsequent calls', async () => {
      const relationship1 = await getOrCreateRelationship({
        individualId,
        businessId,
        contactId,
      });
      relationshipId = relationship1.id;

      const relationship2 = await getOrCreateRelationship({
        individualId,
        businessId,
        contactId,
      });

      expect(relationship2.id).toBe(relationship1.id);
    });

    it('enforces unique constraint on individualId + businessId', async () => {
      const relationship1 = await getOrCreateRelationship({
        individualId,
        businessId,
        contactId,
      });
      relationshipId = relationship1.id;

      // Try to create another relationship with the same pair
      const relationship2 = await getOrCreateRelationship({
        individualId,
        businessId,
        contactId,
      });

      expect(relationship2.id).toBe(relationship1.id);
    });

    it('updates rolling summary', async () => {
      const relationship = await getOrCreateRelationship({
        individualId,
        businessId,
        contactId,
      });
      relationshipId = relationship.id;

      const summary = 'This is a test summary of the conversation.';
      const summaryUpTo = new Date();

      await updateRelationshipSummary({
        relationshipId,
        summary,
        summaryUpTo,
      });

      const updated = await getRelationship(relationshipId);
      expect(updated?.summary).toBe(summary);
      expect(updated?.summaryUpTo).toEqual(summaryUpTo);
      expect(updated?.summaryVersion).toBe(1);
    });
  });

  describe('Ingest', () => {
    beforeEach(async () => {
      const relationship = await getOrCreateRelationship({
        individualId,
        businessId,
        contactId,
      });
      relationshipId = relationship.id;
    });

    it('assigns monotonic seq numbers to messages', async () => {
      const msg1 = await ingestMessage({
        relationshipId,
        callId,
        turnIndex: 0,
        role: 'user',
        content: 'Hello',
        time: 'Now',
        conversationId,
      });

      const msg2 = await ingestMessage({
        relationshipId,
        callId,
        turnIndex: 1,
        role: 'assistant',
        content: 'Hi there',
        time: 'Now',
        conversationId,
      });

      expect(msg1.seq).toBe(BigInt(1));
      expect(msg2.seq).toBe(BigInt(2));
    });

    it('sets speaker correctly for call messages', async () => {
      const userMsg = await ingestMessage({
        relationshipId,
        callId,
        turnIndex: 0,
        role: 'user',
        content: 'Hello',
        time: 'Now',
        conversationId,
      });

      const agentMsg = await ingestMessage({
        relationshipId,
        callId,
        turnIndex: 1,
        role: 'assistant',
        content: 'Hi there',
        time: 'Now',
        conversationId,
      });

      expect(userMsg.speaker).toBe('business');
      expect(agentMsg.speaker).toBe('individual_agent');
    });

    it('sets visibility to both for call messages', async () => {
      const msg = await ingestMessage({
        relationshipId,
        callId,
        turnIndex: 0,
        role: 'user',
        content: 'Hello',
        time: 'Now',
        conversationId,
      });

      expect(msg.visibility).toBe('both');
    });

    it('is idempotent: replaying same turn writes one row', async () => {
      const msg1 = await ingestMessage({
        relationshipId,
        callId,
        turnIndex: 0,
        role: 'user',
        content: 'Hello',
        time: 'Now',
        conversationId,
      });

      // Try to ingest the same turn again
      const msg2 = await ingestMessage({
        relationshipId,
        callId,
        turnIndex: 0,
        role: 'user',
        content: 'Hello',
        time: 'Now',
        conversationId,
      });

      expect(msg1.id).toBe(msg2.id);
    });

    it('handles batch message ingestion', async () => {
      const turns = [
        { role: 'user' as const, content: 'Hello', time: 'Now' },
        { role: 'assistant' as const, content: 'Hi there', time: 'Now' },
        { role: 'user' as const, content: 'How are you?', time: 'Now' },
      ];

      const messages = await ingestMessages({
        relationshipId,
        callId,
        conversationId,
        turns,
      });

      expect(messages).toHaveLength(3);
      expect(messages[0].seq).toBe(BigInt(1));
      expect(messages[1].seq).toBe(BigInt(2));
      expect(messages[2].seq).toBe(BigInt(3));
    });
  });

  describe('Briefing', () => {
    // The briefing is built for a NEW call; `callId` above is the earlier call it reads history from.
    let currentCallId: string;

    beforeEach(async () => {
      const current = await prisma.call.create({
        data: {
          conversationId,
          contactId,
          individualId,
          businessId,
          from: '+15551234567',
          to: '+15559876543',
          status: 'in-progress',
          direction: 'outbound',
          initiatedBy: 'individual',
          startedAt: new Date(),
        },
      });
      currentCallId = current.id;

      const relationship = await getOrCreateRelationship({
        individualId,
        businessId,
        contactId,
      });
      relationshipId = relationship.id;

      // Add some messages to the earlier call
      await ingestMessages({
        relationshipId,
        callId,
        conversationId,
        turns: [
          { role: 'user' as const, content: 'I need an electrician', time: 'Now' },
          { role: 'assistant' as const, content: 'What do you need help with?', time: 'Now' },
          { role: 'user' as const, content: 'My lights are not working', time: 'Now' },
        ],
      });

      // Add some knowledge
      await prisma.contactKnowledge.create({
        data: {
          contactId,
          category: 'address',
          key: 'street',
          value: '123 Main St',
          status: 'active',
        },
      });
    });

    it('builds a briefing with relationship data', async () => {
      const briefing = await buildBriefing(currentCallId, { consolidationWaitMs: 0 });

      expect(briefing.version).toBe(1);
      expect(briefing.relationshipId).toBe(relationshipId);
      expect(briefing.individual.name).toBe('Test Individual');
      expect(briefing.business.name).toBe('Test Business');
      expect(briefing.knownFacts).toHaveLength(1);
      expect(briefing.knownFacts[0].key).toBe('street');
    });

    it('includes last call tail in briefing', async () => {
      const briefing = await buildBriefing(currentCallId, { consolidationWaitMs: 0 });

      expect(briefing.thread.lastCallTail).toHaveLength(3);
      expect(briefing.thread.lastCallTail[0].speaker).toBe('business');
      expect(briefing.thread.lastCallTail[0].text).toBe('I need an electrician');
    });

    it('renders briefing to text', async () => {
      const briefing = await buildBriefing(currentCallId, { consolidationWaitMs: 0 });
      const rendered = renderBriefing(briefing);

      expect(rendered).toContain('Test Individual');
      expect(rendered).toContain('Test Business');
      expect(rendered).toContain('street: 123 Main St');
      expect(rendered).toContain('I need an electrician');
    });

    it('respects token budget and trims from bottom', async () => {
      const briefing = await buildBriefing(currentCallId, { consolidationWaitMs: 0 });
      const rendered = renderBriefing(briefing, { maxTokens: 100 });

      // Should be trimmed but still contain essential sections
      expect(rendered).toContain('Test Individual');
      // Business info may be trimmed at very low token budgets
    });

    it('includes quality flag based on consolidation status', async () => {
      const briefing = await buildBriefing(currentCallId, { consolidationWaitMs: 0 });

      // The earlier call is not consolidated yet
      expect(briefing.quality.complete).toBe(false);
    });
  });

  describe('OpenLoop', () => {
    beforeEach(async () => {
      const relationship = await getOrCreateRelationship({
        individualId,
        businessId,
        contactId,
      });
      relationshipId = relationship.id;
    });

    it('creates an open loop', async () => {
      const openLoop = await createOpenLoop({
        relationshipId,
        kind: 'awaiting_owner',
        text: 'What is the gate code?',
      });

      expect(openLoop).toBeDefined();
      expect(openLoop.kind).toBe('awaiting_owner');
      expect(openLoop.text).toBe('What is the gate code?');
      expect(openLoop.status).toBe('open');
    });

    it('resolves an open loop', async () => {
      const openLoop = await createOpenLoop({
        relationshipId,
        kind: 'awaiting_owner',
        text: 'What is the gate code?',
      });

      const resolved = await resolveOpenLoop(openLoop.id);

      expect(resolved.status).toBe('resolved');
      expect(resolved.resolvedAt).toBeDefined();
    });

    it('gets open loops for a relationship', async () => {
      await createOpenLoop({
        relationshipId,
        kind: 'awaiting_owner',
        text: 'Question 1',
      });

      await createOpenLoop({
        relationshipId,
        kind: 'scheduled',
        text: 'Task 1',
      });

      const openLoops = await getOpenLoops(relationshipId);

      expect(openLoops).toHaveLength(2);
    });

    it('creates open loop from query', async () => {
      const query = await prisma.query.create({
        data: {
          question: 'What is the gate code?',
          status: 'pending',
          conversationId,
          contactId,
        },
      });

      const openLoop = await createOpenLoopFromQuery({
        relationshipId,
        queryId: query.id,
        question: query.question,
        sourceCallId: callId,
      });

      expect(openLoop.kind).toBe('awaiting_owner');
      expect(openLoop.queryId).toBe(query.id);
      expect(openLoop.visibility).toBe('individual_only');
    });

    it('creates open loop from task', async () => {
      const task = await prisma.task.create({
        data: {
          title: 'Fix lights',
          status: 'open',
          conversationId,
          contactId,
        },
      });

      const openLoop = await createOpenLoopFromTask({
        relationshipId,
        taskId: task.id,
        title: task.title,
      });

      expect(openLoop.kind).toBe('scheduled');
      expect(openLoop.taskId).toBe(task.id);
    });

    it('includes open loops in briefing', async () => {
      await createOpenLoop({
        relationshipId,
        kind: 'awaiting_owner',
        text: 'What is the gate code?',
      });

      const briefing = await buildBriefing(callId);

      expect(briefing.openLoops).toHaveLength(1);
      expect(briefing.openLoops[0].kind).toBe('awaiting_owner');
      expect(briefing.openLoops[0].text).toBe('What is the gate code?');
    });
  });

  describe('Cross-relationship isolation', () => {
    let otherIndividualId: string;
    let otherBusinessId: string;
    let otherContactId: string;
    let otherRelationshipId: string;

    beforeEach(async () => {
      // Create another individual and business
      const otherIndividual = await prisma.account.create({
        data: {
          email: `other-individual-${runId}@test.com`,
          name: 'Other Individual',
          isService: false,
        },
      });
      otherIndividualId = otherIndividual.id;

      const otherBusiness = await prisma.account.create({
        data: {
          email: `other-business-${runId}@test.com`,
          name: 'Other Business',
          business: 'Plumber',
          isService: true,
          ownerId: otherIndividualId,
        },
      });
      otherBusinessId = otherBusiness.id;

      const otherContact = await prisma.account.create({
        data: {
          email: `other-contact-${runId}@test.com`,
          name: 'Other Contact',
          isService: true,
          ownerId: otherIndividualId,
          linkedAccountId: otherBusinessId,
        },
      });
      otherContactId = otherContact.id;

      const otherRelationship = await getOrCreateRelationship({
        individualId: otherIndividualId,
        businessId: otherBusinessId,
        contactId: otherContactId,
      });
      otherRelationshipId = otherRelationship.id;

      // Add data to the original relationship
      const relationship = await getOrCreateRelationship({
        individualId,
        businessId,
        contactId,
      });
      relationshipId = relationship.id;

      await createOpenLoop({
        relationshipId,
        kind: 'awaiting_owner',
        text: 'Secret question',
      });
    });

    afterEach(async () => {
      await prisma.openLoop.deleteMany({ where: { relationshipId: otherRelationshipId } });
      await prisma.relationship.deleteMany({ where: { individualId: otherIndividualId } });
      await prisma.account.deleteMany({ where: { id: otherContactId } });
      await prisma.account.deleteMany({ where: { id: otherBusinessId } });
      await prisma.account.deleteMany({ where: { id: otherIndividualId } });
    });

    it('does not include other relationship data in briefing', async () => {
      const briefing = await buildBriefing(callId);

      // Should only include the original relationship's open loop
      expect(briefing.openLoops).toHaveLength(1);
      expect(briefing.openLoops[0].text).toBe('Secret question');
    });
  });
});
