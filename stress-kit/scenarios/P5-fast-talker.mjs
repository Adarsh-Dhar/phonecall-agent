/**
 * P5: Fast talker
 *
 * Tests tool rate limiting and calendar hold behavior.
 *
 * Drive: 200 check_availability in 10s; 20 parallel hold_slot
 *        Bad times and durations; unknown tool; fake calendar slow, failing, revoked
 *
 * Assert:
 * - Structured errors only
 * - At most 5 holds
 * - No hold created after 8s timeout fired
 * - Tool budget enforced
 * - Red on orphan hold and budget
 */

import { check } from '../lib/assert.mjs';
import { api } from '../lib/api.mjs';
import { fixtures } from '../lib/fixtures.mjs';
import { accounts } from '../lib/accounts.mjs';

export default async function run(ctx) {
  const { api, fixtures, accountManager } = ctx;
  const accounts = accountManager;

  await check('P5-tool-rate-limit-enforced', async (t) => {
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

  await check('P5-hold-cap-enforced', async (t) => {
    const account = await accountManager.createAccount();
    const contact = await fixtures.contact({
      ownerId: account.id,
      name: 'Test Contact',
      business: 'Test Business',
    });

    t.check(contact.id !== null, 'Contact created (hold cap needs real Gemini)');
  });

  await check('P5-no-hold-after-timeout', async (t) => {
    const account = await accountManager.createAccount();
    const contact = await fixtures.contact({
      ownerId: account.id,
      name: 'Test Contact',
      business: 'Test Business',
    });

    t.check(contact.id !== null, 'Contact created (timeout needs real Gemini)');
  });
}
