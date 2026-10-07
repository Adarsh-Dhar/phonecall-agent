import { describe, it, expect, vi } from 'vitest';
import { createCallLifecycle } from '../callLifecycle';
import { prisma } from '@workspace/db-prisma';

vi.mock('@workspace/db-prisma', () => ({
  prisma: {
    call: {
      update: vi.fn(),
    },
    message: {
      create: vi.fn(),
    },
  },
}));

vi.mock('../taskExtraction', () => ({
  scheduleExtraction: vi.fn(),
}));

vi.mock('../callAnalysis', () => ({
  analyzeCallForEscalation: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../liveEscalation', () => ({
  askUserDuringCall: vi.fn(),
  rejectLiveQueries: vi.fn(),
}));

describe('callLifecycle', () => {
  it('onEndCall delays by the queued audio length and caps at 8 seconds', async () => {
    const send = vi.fn();
    const closeSocket = vi.fn();
    const getGemini = vi.fn(() => null);
    const clearGemini = vi.fn();

    const lifecycle = createCallLifecycle({
      callId: 'call-1',
      conversationId: 'conv-1',
      ownerId: 'owner-1',
      contactId: 'contact-1',
      startedAt: new Date(),
      send,
      closeSocket,
      getGemini,
      clearGemini,
    });

    // Simulate 2 seconds of audio queued (24000 samples/sec * 2s = 48000 samples)
    lifecycle.noteAudioOut(new Int16Array(48000));
    const startTime = Date.now();

    await lifecycle.onEndCall({
      outcome: 'booked',
      summary: 'Test summary',
    });

    const elapsed = Date.now() - startTime;
    // Should wait for audio to finish (2000ms) + 300ms grace period = 2300ms minimum
    expect(elapsed).toBeGreaterThanOrEqual(2300);
    expect(elapsed).toBeLessThan(8000);
  });

  it('end_call args persist outcome, confirmedAt and confirmationRef', async () => {
    const send = vi.fn();
    const closeSocket = vi.fn();
    const getGemini = vi.fn(() => null);
    const clearGemini = vi.fn();

    const lifecycle = createCallLifecycle({
      callId: 'call-1',
      conversationId: 'conv-1',
      ownerId: 'owner-1',
      contactId: 'contact-1',
      startedAt: new Date(),
      send,
      closeSocket,
      getGemini,
      clearGemini,
    });

    await lifecycle.end('agent', {
      outcome: 'booked',
      summary: 'Appointment confirmed',
      confirmedAt: '2026-10-08T10:00:00Z',
      confirmationRef: 'REF-123',
    });

    expect(prisma.call.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          outcome: 'booked',
          outcomeSummary: 'Appointment confirmed',
          confirmedAt: expect.any(Date),
          confirmationRef: 'REF-123',
        }),
      })
    );
  });

  it('onGeminiClosed ends the call as failed', async () => {
    const send = vi.fn();
    const closeSocket = vi.fn();
    const getGemini = vi.fn(() => null);
    const clearGemini = vi.fn();

    const lifecycle = createCallLifecycle({
      callId: 'call-1',
      conversationId: 'conv-1',
      ownerId: 'owner-1',
      contactId: 'contact-1',
      startedAt: new Date(),
      send,
      closeSocket,
      getGemini,
      clearGemini,
    });

    await lifecycle.onGeminiClosed();

    expect(prisma.call.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          outcome: 'failed',
          outcomeSummary: 'Voice session dropped',
        }),
      })
    );
  });
});
