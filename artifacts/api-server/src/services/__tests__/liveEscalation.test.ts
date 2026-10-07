import { describe, it, expect, beforeEach, vi } from 'vitest';
import { askUserDuringCall, resolveLiveQuery, rejectLiveQueries } from '../liveEscalation';
import { prisma } from '@workspace/db-prisma';

vi.mock('@workspace/db-prisma', () => ({
  prisma: {
    query: {
      create: vi.fn(),
    },
  },
}));

describe('liveEscalation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ask_user resolves with the answer through resolveLiveQuery', async () => {
    vi.mocked(prisma.query.create).mockResolvedValue({
      id: 'query-1',
      question: 'What is the price?',
    } as any);

    const promise = askUserDuringCall({
      callId: 'call-1',
      conversationId: 'conv-1',
      contactId: 'contact-1',
      ownerId: 'owner-1',
      question: 'What is the price?',
    });

    // Simulate user answering after 100ms
    setTimeout(() => {
      resolveLiveQuery('query-1', '$50');
    }, 100);

    const answer = await promise;
    expect(answer).toBe('$50');
  });

  it('ask_user times out and the agent receives USER_UNAVAILABLE', async () => {
    vi.mocked(prisma.query.create).mockResolvedValue({
      id: 'query-2',
      question: 'What is the price?',
    } as any);

    const promise = askUserDuringCall({
      callId: 'call-2',
      conversationId: 'conv-2',
      contactId: 'contact-2',
      ownerId: 'owner-2',
      question: 'What is the price?',
    });

    // Set timeout to 100ms for testing
    process.env.ASK_USER_TIMEOUT_MS = '100';

    const answer = await promise;
    expect(answer).toBe('USER_UNAVAILABLE');
  });

  it('rejectLiveQueries resolves all pending queries for a call', () => {
    const resolve1 = vi.fn();
    const resolve2 = vi.fn();
    const timer1 = setTimeout(() => {}, 1000);
    const timer2 = setTimeout(() => {}, 1000);

    // Manually populate the pending map (bypassing askUserDuringCall)
    const pending = (global as any).__testPending = new Map();
    pending.set('query-1', { resolve: resolve1, timer: timer1, callId: 'call-1' });
    pending.set('query-2', { resolve: resolve2, timer: timer2, callId: 'call-1' });
    pending.set('query-3', { resolve: vi.fn(), timer: setTimeout(() => {}, 1000), callId: 'call-2' });

    rejectLiveQueries('call-1');

    expect(resolve1).toHaveBeenCalledWith('USER_UNAVAILABLE');
    expect(resolve2).toHaveBeenCalledWith('USER_UNAVAILABLE');
    expect(pending.has('query-1')).toBe(false);
    expect(pending.has('query-2')).toBe(false);
    expect(pending.has('query-3')).toBe(true);

    clearTimeout(timer1);
    clearTimeout(timer2);
    clearTimeout((pending.get('query-3') as any).timer);
    pending.clear();
  });
});
