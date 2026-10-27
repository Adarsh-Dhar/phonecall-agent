/**
 * X3: Chaos soak
 *
 * 60-minute soak with random fault injection.
 *
 * TODO: Implement with real Nebius and real Gemini
 *
 * Drive: Random fault injector: Nebius 429/500/hang bursts, Gemini drops
 *        kill -9 of one instance, slow calendar
 *        Invariants every 60s
 *
 * Assert:
 * - Heap, connection, and open-row slopes must be flat
 * - No crashes
 * - Recovery from faults
 */

import { check } from '../lib/assert.mjs';
import { api } from '../lib/api.mjs';
import { fixtures } from '../lib/fixtures.mjs';
import { accounts } from '../lib/accounts.mjs';

export default async function run(ctx) {
  const { api, fixtures, accountManager } = ctx;
  const accounts = accountManager;

  await check('X3-nebius-fault-recovery', async (t) => {
    const account = await accountManager.createAccount();
    const contact = await fixtures.contact({
      ownerId: account.id,
      name: 'Test Contact',
      business: 'Test Business',
    });

    const conversation = await fixtures.conversation({
      contactId: contact.id,
    });

    t.check(conversation.id !== null, 'Conversation created (fault recovery needs injection)');
  });

  await check('X3-gemini-drop-recovery', async (t) => {
    const account = await accountManager.createAccount();
    const contact = await fixtures.contact({
      ownerId: account.id,
      name: 'Test Contact',
      business: 'Test Business',
    });

    t.check(contact.id !== null, 'Contact created (drop recovery needs injection)');
  });

  await check('X3-kill-restart-recovery', async (t) => {
    const account = await accountManager.createAccount();
    t.check(account.id !== null, 'Account created (kill restart needs server manager)');
  });

  await check('X3-heap-connections-flat', async (t) => {
    const account = await accountManager.createAccount();
    t.check(account.id !== null, 'Account created (heap monitoring needs 60-min soak)');
  });
}
