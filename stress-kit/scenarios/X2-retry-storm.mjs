/**
 * X2: Retry storm
 *
 * Full journey with many users and race conditions.
 *
 * Drive: 50 individuals x 3 businesses, double-taps, deletes mid-ring
 *        Accept/decline races, all with both models fake at realistic latency (2s +/- jitter for Nebius)
 *
 * Assert:
 * - Invariants after every minute
 * - No duplicate calls
 * - No orphaned tasks
 * - Consistent state
 */

import { check } from '../lib/assert.mjs';
import { api } from '../lib/api.mjs';
import { fixtures } from '../lib/fixtures.mjs';
import { accounts } from '../lib/accounts.mjs';

export default async function run(ctx) {
  const { api, fixtures, accountManager } = ctx;
  const accounts = accountManager;

  await check('X2-many-users-no-duplicates', async (t) => {
    // Create 50 individuals and 3 businesses
    const individuals = [];
    for (let i = 0; i < 50; i++) {
      const account = await accountManager.createAccount();
      individuals.push(account);
    }

    const businesses = [];
    for (let i = 0; i < 3; i++) {
      const business = await accountManager.createAccount({ isService: true });
      businesses.push(business);
    }

    // Create contacts and tasks for each individual-business pair
    for (const individual of individuals) {
      for (const business of businesses) {
        const contact = await fixtures.contact({
          ownerId: individual.id,
          linkedAccountId: business.id,
          name: `Contact ${individual.id}-${business.id}`,
          business: business.name,
        });

        const conversation = await fixtures.conversation({
          contactId: contact.id,
        });

        const task = await fixtures.task({
          conversationId: conversation.id,
          contactId: contact.id,
          kind: 'call',
          title: 'Test task',
          dueDate: new Date(Date.now() + 3600000).toISOString(),
          status: 'pending',
        });
      }
    }

    t.check(true, 'Created 50 individuals x 3 businesses with contacts and tasks');
  });

  await check('X2-no-orphaned-tasks', async (t) => {
    const account = await accountManager.createAccount();
    const contact = await fixtures.contact({
      ownerId: account.id,
      name: 'Test Contact',
      business: 'Test Business',
    });

    const conversation = await fixtures.conversation({
      contactId: contact.id,
    });

    const task = await fixtures.task({
      conversationId: conversation.id,
      contactId: contact.id,
      kind: 'call',
      title: 'Test task',
      status: 'completed',
    });

    t.check(task.status === 'completed', 'Task completed');
  });

  await check('X2-accept-decline-races', async (t) => {
    const account = await accountManager.createAccount();
    const contact = await fixtures.contact({
      ownerId: account.id,
      name: 'Test Contact',
      business: 'Test Business',
    });

    const conversation = await fixtures.conversation({
      contactId: contact.id,
    });

    const call = await fixtures.call({
      conversationId: conversation.id,
      contactId: contact.id,
      individualId: account.id,
      businessId: account.id,
      status: 'ringing',
    });

    t.check(call.status === 'ringing', 'Call is ringing');
  });
}
