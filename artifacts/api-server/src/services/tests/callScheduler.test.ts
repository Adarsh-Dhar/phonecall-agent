import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkDueTasks } from '../callScheduler';

vi.mock('@workspace/db-prisma', () => ({
  prisma: {
    task: {
      updateMany: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    account: {
      findUnique: vi.fn(),
    },
    call: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('../notifications', () => ({
  broadcastCallDue: vi.fn().mockResolvedValue(true),
  broadcastCallExhausted: vi.fn().mockResolvedValue(true),
}));

vi.mock('../telephony', () => ({
  isAutoDialEnabled: vi.fn().mockReturnValue(false),
  placeCall: vi.fn().mockResolvedValue({ success: false }),
}));

vi.mock('../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { prisma } from '@workspace/db-prisma';
import { logger } from '../../lib/logger';

describe('callScheduler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports checkDueTasks for testing', () => {
    expect(typeof checkDueTasks).toBe('function');
  });

  it('handles tasks with invalid businessHoursJson gracefully', async () => {
    vi.mocked(prisma.task.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.task.findMany).mockResolvedValue([
      {
        id: 'task-1',
        title: 'Test Task',
        contactId: 'contact-1',
        callAttempts: 0,
        conversationId: 'conv-1',
        contact: {
          id: 'contact-1',
          name: 'Test Contact',
          ownerId: 'owner-1',
          phone: '+1234567890',
          businessHoursJson: 'invalid json',
        },
      },
    ]);
    vi.mocked(prisma.account.findUnique).mockResolvedValue({
      id: 'owner-1',
      timezone: 'Asia/Kolkata',
      quietHoursStart: null,
      quietHoursEnd: null,
    });
    vi.mocked(prisma.call.findFirst).mockResolvedValue(null);

    await checkDueTasks();

    // Should log a warning about invalid businessHoursJson
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: 'task-1',
        contactId: 'contact-1',
      }),
      'callScheduler: invalid businessHoursJson, ignoring'
    );
  });
});
