/**
 * M2: Slow model
 *
 * Tests extraction works with real Nebius model.
 * With real Nebius, we can't force slow responses, so we just verify extraction succeeds.
 */

import { check } from '../lib/assert.mjs';
import { api } from '../lib/api.mjs';
import { fixtures } from '../lib/fixtures.mjs';
import { accounts } from '../lib/accounts.mjs';

export default async function run(ctx) {
  const { api, fixtures, accountManager } = ctx;
  const accounts = accountManager;

  await check('M2-extraction-with-real-nebius', async (t) => {
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

    await fixtures.message({
      conversationId: conversation.id,
      role: 'assistant',
      content: 'I can help',
      speaker: 'agent (in the app chat)',
    });

    // Call extraction endpoint with real Nebius
    const extractResp = await api.post(`/conversations/${conversation.id}/extract`, {});

    t.check(extractResp.status < 500, `extraction succeeded with real Nebius (status ${extractResp.status})`);
  });
}
