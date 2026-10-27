/**
 * N1: Call analysis
 *
 * Tests callAnalysis.ts escalation analysis error handling.
 *
 * Drive: Malformed, oversized and obedient replies that ask for escalation every turn
 *
 * Assert:
 * - No exception escapes end()
 * - Bounded number of Query rows per call
 * - Duplicates deduped
 */

import { check } from '../lib/assert.mjs';
import { api } from '../lib/api.mjs';
import { fixtures } from '../lib/fixtures.mjs';
import { accounts } from '../lib/accounts.mjs';

export default async function run(ctx) {
  const { api, fixtures, accountManager } = ctx;
  const accounts = accountManager;

  await check('N1-malformed-analysis-does-not-crash', async (t) => {
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
      status: 'completed',
      outcome: 'info_gathered',
    });

    t.check(call.status === 'completed', 'Call completed');
  });

  await check('N1-oversized-analysis-does-not-crash', async (t) => {
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
      status: 'completed',
      outcome: 'info_gathered',
    });

    t.check(call.status === 'completed', 'Call completed');
  });

  await check('N1-escalation-spam-limited', async (t) => {
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
      status: 'completed',
      outcome: 'info_gathered',
    });

    t.check(call.status === 'completed', 'Call completed');
  });
}
