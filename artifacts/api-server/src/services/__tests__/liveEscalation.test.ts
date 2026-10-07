import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('@workspace/db-prisma', () => ({
  prisma: { query: { create: vi.fn() } },
}));
vi.mock('../presence', () => ({ sendToAccount: vi.fn().mockReturnValue(true) }));
vi.mock('../push', () => ({ sendPushToAccount: vi.fn().mockResolvedValue(undefined) }));

import { prisma } from '@workspace/db-prisma';
import { askUserDuringCall, resolveLiveQuery, rejectLiveQueries } from '../liveEscalation';

const tick = () => new Promise((r) => setTimeout(r, 0));
const ask = (callId: string) =>
  askUserDuringCall({
    callId,
    conversationId: 'conv',
    contactId: 'contact',
    ownerId: 'owner',
    question: 'What is the price?',
  });

describe('liveEscalation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ASK_USER_TIMEOUT_MS = '5000';
  });
  afterEach(() => {
    delete process.env.ASK_USER_TIMEOUT_MS;
  });

  it('ask_user resolves with the answer through resolveLiveQuery', async () => {
    vi.mocked(prisma.query.create).mockResolvedValueOnce({ id: 'q-1' } as any);
    const promise = ask('call-1');
    await tick();
    expect(resolveLiveQuery('q-1', '$50')).toBe(true);
    expect(await promise).toBe('$50');
    expect(resolveLiveQuery('q-1', 'again')).toBe(false); // already consumed
  });

  it('ask_user times out and the agent receives USER_UNAVAILABLE', async () => {
    process.env.ASK_USER_TIMEOUT_MS = '50';
    vi.mocked(prisma.query.create).mockResolvedValueOnce({ id: 'q-2' } as any);
    expect(await ask('call-2')).toBe('USER_UNAVAILABLE');
    expect(resolveLiveQuery('q-2', 'too late')).toBe(false); // no longer pending
  });

  it('rejectLiveQueries releases only the pending asks of that call', async () => {
    vi.mocked(prisma.query.create)
      .mockResolvedValueOnce({ id: 'q-a' } as any)
      .mockResolvedValueOnce({ id: 'q-b' } as any)
      .mockResolvedValueOnce({ id: 'q-c' } as any);

    const a = ask('call-x');
    const b = ask('call-x');
    const c = ask('call-y');
    await tick();

    rejectLiveQueries('call-x');
    expect(await a).toBe('USER_UNAVAILABLE');
    expect(await b).toBe('USER_UNAVAILABLE');

    expect(resolveLiveQuery('q-c', 'still here')).toBe(true); // other call untouched
    expect(await c).toBe('still here');
  });
});
