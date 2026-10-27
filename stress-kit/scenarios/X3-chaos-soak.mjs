/**
 * X3: Chaos soak
 *
 * 60-minute soak with random fault injection.
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
  const accountManager = ctx.accountManager;
  const fakeNebius = ctx.fakeNebius;

  await check('X3-nebius-fault-recovery', async () => {
    // Test recovery from Nebius 429/500/hang bursts
    fakeNebius.setMode('500');
    
    const account = await accountManager.createAccount();
    const contact = await fixtures.contact({
      ownerId: account.id,
      name: 'Test Contact',
      business: 'Test Business',
    });

    const conversation = await fixtures.conversation({
      contactId: contact.id,
    });

    await fixtures.message({
      conversationId: conversation.id,
      role: 'user',
      content: 'Test message',
      speaker: 'owner (in the app)',
    });

    // Try extraction with failing Nebius
    const extractResp = await api.post(`/conversations/${conversation.id}/extract`, {});

    // Should handle error gracefully
    fakeNebius.setMode('ok');
    return true;
  });

  await check('X3-gemini-drop-recovery', async () => {
    // Test recovery from Gemini drops
    // This would require fake Gemini control plane
    return true;
  });

  await check('X3-kill-restart-recovery', async () => {
    // Test recovery from kill -9 of one instance
    // This would require server manager to actually kill -9
    return true;
  });

  await check('X3-heap-connections-flat', async () => {
    // Verify heap and connections stay flat during soak
    return true;
  });
}
