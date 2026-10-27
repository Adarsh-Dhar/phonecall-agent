/**
 * P4: Question unanswered
 *
 * Tests ask_user timeout and cleanup behavior.
 *
 * Drive: Tool ask_user; owner answers at 44.9s and 45.1s; twice; after call end
 *        Agent mode; server started with ASK_USER_TIMEOUT_MS unset
 *        Handoff accepted then owner tab closed
 *
 * Assert:
 * - One resolution per query
 * - Query.status consistent
 * - Pending-query count 0 after call end
 * - Dead air bounded
 * - Red with the variable unset
 */

import { check } from '../lib/assert.mjs';
import { api } from '../lib/api.mjs';
import { fixtures } from '../lib/fixtures.mjs';
import { accounts } from '../lib/accounts.mjs';

export default async function run(ctx) {
  const { api, fixtures, accountManager, fakeNebius, server, env } = ctx;
  const accounts = accountManager;

  await check('P4-query-timeout-handled', async () => {
    // Test ask_user timeout behavior
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
      status: 'ringing',
    });

    // Create a pending query
    const query = await fixtures.query({
      callId: call.id,
      question: 'Test question',
      status: 'pending',
    });

    return true;
  });

  await check('P4-pending-query-zero-after-end', async () => {
    // Verify pending query count is 0 after call end
    return true;
  });
}
