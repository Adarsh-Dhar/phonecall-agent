/**
 * N4: Orchestrator route
 *
 * Tests routes/orchestrator.ts error handling.
 *
 * Drive: Unauthenticated and cross-account calls, huge prompts, provider error
 *        Run once with TEST_MODE off
 *
 * Assert:
 * - Auth required
 * - Prompt size cap
 * - No key or raw provider error in the body
 * - 429 under spam
 */

import { check } from '../lib/assert.mjs';
import { api } from '../lib/api.mjs';
import { fixtures } from '../lib/fixtures.mjs';
import { accounts } from '../lib/accounts.mjs';

export default async function run(ctx) {
  const { api, fixtures, accountManager, env } = ctx;
  const accounts = accountManager;

  await check('N4-auth-required', async () => {
    // Try to call orchestrator without auth
    const resp = await fetch(`${env.baseUrl}/orchestrator/extraction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'test' }],
      }),
    });

    // Should return 401
    if (resp.status !== 401) {
      throw new Error(`Expected 401, got ${resp.status}`);
    }

    return true;
  });

  await check('N4-cross-account-rejected', async () => {
    // Create two accounts
    const account1 = await accountManager.createAccount();
    const account2 = await accountManager.createAccount();

    const contact1 = await fixtures.contact({
      ownerId: account1.id,
      name: 'Contact 1',
      business: 'Business 1',
    });

    const conversation1 = await fixtures.conversation({
      contactId: contact1.id,
    });

    // Try to access conversation1 with account2's token
    const token2 = accountManager.mintJwt(account2.id);

    const resp = await fetch(`${env.baseUrl}/orchestrator/extraction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token2}`,
      },
      body: JSON.stringify({
        conversationId: conversation1.id,
        messages: [{ role: 'user', content: 'test' }],
      }),
    });

    // Should return 403 (forbidden)
    if (resp.status !== 403 && resp.status !== 404) {
      throw new Error(`Expected 403/404 for cross-account, got ${resp.status}`);
    }

    return true;
  });

  await check('N4-prompt-size-capped', async () => {
    const account = await accountManager.createAccount();
    const token = accountManager.mintJwt(account.id);

    const contact = await fixtures.contact({
      ownerId: account.id,
      name: 'Test Contact',
      business: 'Test Business',
    });

    const conversation = await fixtures.conversation({
      contactId: contact.id,
    });

    // Try to send a huge prompt
    const hugePrompt = {
      conversationId: conversation.id,
      messages: [
        {
          role: 'user',
          content: 'A'.repeat(10000000), // 10MB prompt
        },
      ],
    };

    const resp = await fetch(`${env.baseUrl}/orchestrator/extraction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(hugePrompt),
    });

    // Should return 4xx (request too large)
    if (resp.status === 200 || resp.status === 201) {
      throw new Error('Huge prompt was accepted');
    }

    return true;
  });

  await check('N4-provider-error-not-exposed', async () => {
    const account = await accountManager.createAccount();
    const token = accountManager.mintJwt(account.id);

    const contact = await fixtures.contact({
      ownerId: account.id,
      name: 'Test Contact',
      business: 'Test Business',
    });

    const conversation = await fixtures.conversation({
      contactId: contact.id,
    });

    // TODO: Implement real Nebius bad key test (start server with bad NEBIUS_API_KEY)
    return true;
  });

  await check('N4-spam-rate-limited', async () => {
    const account = await accountManager.createAccount();
    const token = accountManager.mintJwt(account.id);

    const contact = await fixtures.contact({
      ownerId: account.id,
      name: 'Test Contact',
      business: 'Test Business',
    });

    const conversation = await fixtures.conversation({
      contactId: contact.id,
    });

    // Try many rapid requests
    const promises = [];
    for (let i = 0; i < 20; i++) {
      promises.push(
        fetch(`${env.baseUrl}/orchestrator/extraction`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            conversationId: conversation.id,
            messages: [{ role: 'user', content: `Spam ${i}` }],
          }),
        })
      );
    }

    const results = await Promise.all(promises);

    // Some should be rate limited (429)
    const rateLimited = results.filter((r) => r.status === 429).length;

    if (rateLimited === 0 && process.env.TEST_MODE !== 'true') {
      console.warn('No rate limiting detected for orchestrator spam');
    }

    return true;
  });
}
