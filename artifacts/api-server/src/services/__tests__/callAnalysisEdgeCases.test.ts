import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { prisma } from '@workspace/db-prisma';
import { analyzeCallForEscalation } from '../callAnalysis';
import { generateOrchestratorText } from '../nebiusText';

vi.mock('../nebiusText', () => ({
  generateOrchestratorText: vi.fn(),
}));

describe('callAnalysis edge cases with real DB', () => {
  let callId: string;
  let contactId: string;
  let ownerId: string;
  let conversationId: string;

  beforeAll(async () => {
    const contact = await prisma.account.create({
      data: {
        googleId: 'test-contact-edge-cases',
        email: 'contact@example.com',
        name: 'Test Contact',
        isService: true,
      },
    });
    contactId = contact.id;

    const owner = await prisma.account.create({
      data: {
        googleId: 'test-owner-edge-cases',
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

    const call = await prisma.call.create({
      data: {
        status: 'completed',
        contactId: contact.id,
        conversationId: conversation.id,
        from: '+11234567890',
        to: '+10987654321',
        startedAt: new Date(),
        endedAt: new Date(),
      },
    });
    callId = call.id;
  });

  afterAll(async () => {
    await prisma.query.deleteMany({ where: { callId } });
    await prisma.call.deleteMany({ where: { id: callId } });
    await prisma.conversation.deleteMany({ where: { id: conversationId } });
    await prisma.account.deleteMany({ where: { googleId: { in: ['test-contact-edge-cases', 'test-owner-edge-cases'] } } });
  });

  it('a parse failure leaves isEnoughKnowledge null', async () => {
    // Mock the orchestrator to throw/return invalid JSON
    vi.mocked(generateOrchestratorText).mockRejectedValue(new Error('Parse error'));

    await analyzeCallForEscalation(callId);

    const call = await prisma.call.findUnique({ where: { id: callId } });
    expect(call?.isEnoughKnowledge).toBeNull();
  });

  it('an existing live query prevents a duplicate post-call query', async () => {
    // Create a pending query from the call
    await prisma.query.create({
      data: {
        question: 'What is the price?',
        status: 'pending',
        conversationId: conversationId,
        contactId: contactId,
        callId: callId,
        isKnowledgeGap: true,
        urgent: true,
      },
    });

    // Mock orchestrator to return needs_user outcome
    vi.mocked(generateOrchestratorText).mockResolvedValue({
      text: JSON.stringify({
        isEnoughKnowledge: false,
        escalationQuestion: 'Need to know price',
        outcome: 'needs_user',
      }),
      model: 'test-model',
    });

    await analyzeCallForEscalation(callId);

    // Should only have one query (the original one), not a duplicate
    const queries = await prisma.query.findMany({ where: { callId } });
    expect(queries.length).toBe(1);
  });

  it('a Hindi transcript turn is stored', async () => {
    // Create a message with Hindi content
    await prisma.message.create({
      data: {
        callId: callId,
        conversationId: conversationId,
        role: 'user',
        content: 'नमस्ते, मैं अपॉइंटमेंट बुक करना चाहता हूं',
        time: new Date().toISOString(),
        createdAt: new Date(),
      },
    });

    const messages = await prisma.message.findMany({ where: { callId } });
    const hindiMessage = messages.find(m => m.content.includes('नमस्ते'));
    expect(hindiMessage).toBeDefined();
    expect(hindiMessage?.content).toBe('नमस्ते, मैं अपॉइंटमेंट बुक करना चाहता हूं');
  });
});
