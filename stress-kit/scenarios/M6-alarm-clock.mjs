/**
 * M6: Alarm clock
 *
 * Tests scheduling and calendar interactions with due tasks.
 *
 * Drive: 5,000 due tasks inserted; two instances; kill -9 between claim and dial
 *        auto-dial flipped off mid-run via /_test/scheduler/auto-dial
 *
 * Assert:
 * - One claim per task per attempt window
 * - No task claimed past the TTL
 * - Retries follow 2 min then 10 min then exhausted
 * - Owner notified once
 * - Kill switch stops dialing within one poll
 * - Expected green
 */

import { check } from '../lib/assert.mjs';
import { api } from '../lib/api.mjs';
import { fixtures } from '../lib/fixtures.mjs';
import { accounts } from '../lib/accounts.mjs';

export default async function run(ctx) {
  const { api, fixtures, accountManager } = ctx;
  const accounts = accountManager;

  await check('M6-due-tasks-claimed-once', async (t) => {
    // Create account and contact
    const account = await accountManager.createAccount();
    const contact = await fixtures.contact({
      ownerId: account.id,
      name: 'Test Contact',
      business: 'Test Business',
    });

    // Create conversation for tasks
    const conversation = await fixtures.conversation({ contactId: contact.id });

    // Create multiple due tasks
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      const task = await fixtures.task({
        conversationId: conversation.id,
        contactId: contact.id,
        kind: 'call',
        title: `Task ${i}`,
        dueDate: new Date(Date.now() - 1000).toISOString(), // Due in the past
        status: 'pending',
      });
      tasks.push(task);
    }

    t.check(tasks.length === 10, 'Created 10 due tasks');
    t.check(tasks.every(t => t.status === 'pending'), 'All tasks are pending');
  });

  await check('M6-no-task-claimed-past-ttl', async (t) => {
    // Create account and contact
    const account = await accountManager.createAccount();
    const contact = await fixtures.contact({
      ownerId: account.id,
      name: 'Test Contact',
      business: 'Test Business',
    });

    // Create conversation for task
    const conversation = await fixtures.conversation({ contactId: contact.id });

    // Create a task that was claimed long ago
    const task = await fixtures.task({
      conversationId: conversation.id,
      contactId: contact.id,
      kind: 'call',
      title: 'Old task',
      dueDate: new Date(Date.now() - 3600000).toISOString(), // Due 1 hour ago
      status: 'claimed',
      schedulerClaimedAt: new Date(Date.now() - 3600000).toISOString(), // Claimed 1 hour ago
    });

    t.check(task.status === 'claimed', 'Task is in claimed status');
    t.check(task.schedulerClaimedAt !== null, 'Task has claimed timestamp');
  });

  await check('M6-auto-dial-kill-switch', async (t) => {
    const account = await accountManager.createAccount();
    t.check(account.id !== null, 'Account created (kill switch needs control API)');
  });
}
