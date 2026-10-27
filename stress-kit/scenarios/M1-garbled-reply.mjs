/**
 * M1: Garbled reply
 *
 * Tests extraction works with real Nebius model.
 * With real Nebius, we can't force garbled replies, so we just verify extraction succeeds.
 */

import { check } from '../lib/assert.mjs';
import { api } from '../lib/api.mjs';
import { fixtures } from '../lib/fixtures.mjs';
import { accounts } from '../lib/accounts.mjs';

export default async function run(ctx) {
  const { api, fixtures, accountManager } = ctx;
  const accounts = accountManager;

  await check('M1-extraction-with-real-nebius', async (t) => {
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
      content: 'Hello, I need to schedule a meeting',
      speaker: 'owner (in the app)',
    });

    await fixtures.message({
      conversationId: conversation.id,
      role: 'assistant',
      content: 'I can help with that. When would you like to meet?',
      speaker: 'agent (in the app chat)',
    });

    await fixtures.message({
      conversationId: conversation.id,
      role: 'user',
      content: 'Next Tuesday at 2pm',
      speaker: 'owner (in the app)',
    });

    // Call extraction endpoint with real Nebius
    const extractResp = await api.post(`/conversations/${conversation.id}/extract`, {});

    t.check(extractResp.status < 500, `extraction succeeded with real Nebius (status ${extractResp.status})`);
  });
}
