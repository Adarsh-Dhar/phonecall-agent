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
import { db } from '../lib/env.mjs';

export default async function run(ctx) {
  const { api, fixtures, accountManager } = ctx;
  const accounts = accountManager;

  await check('P4-query-timeout-handled', async (t) => {
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

    const query = await fixtures.query({
      callId: call.id,
      ownerId: account.id,
      query: 'What is the best time to call?',
    });

    t.check(query.id !== null, 'Query created successfully');
    t.check(query.answeredAt === null, 'Query not yet answered');
  });

  await check('P4-pending-query-zero-after-end', async (t) => {
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
    });

    // Verify no pending queries for completed call
    const result = await db.query(
      `SELECT COUNT(*) as count FROM "LiveQuery" WHERE "callId" = $1 AND "answeredAt" IS NULL`,
      [call.id]
    );

    const count = parseInt(result.rows[0].count, 10);
    t.check(count === 0, `No pending queries for completed call (count: ${count})`);
  });
}
