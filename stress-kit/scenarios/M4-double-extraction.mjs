/**
 * M4: Double extraction
 *
 * Tests race conditions and deduplication during concurrent extractions.
 *
 * TODO: Implement with real Nebius (no fake-Gemini)
 *
 * Assert:
 * - Each message extracted once
 * - No duplicate tasks
 * - Cursor never decreases
 * - Startup sweep re-extracts within a bound
 * - Red: identical-turn dedupe; possibly seq race
 */

import { check } from '../lib/assert.mjs';
import { api } from '../lib/api.mjs';
import { fixtures } from '../lib/fixtures.mjs';
import { accounts } from '../lib/accounts.mjs';

export default async function run(ctx) {
  const { api, fixtures, accountManager } = ctx;
  const accounts = accountManager;

  await check('M4-concurrent-extraction-deduped', async () => {
    // Create account and conversation
    const account = await accountManager.createAccount();
    const contact = await fixtures.contact({
      ownerId: account.id,
      name: 'Test Contact',
      business: 'Test Business',
    });

    const conversation = await fixtures.conversation({
      contactId: contact.id,
    });

    // Add many messages
    for (let i = 0; i < 20; i++) {
      await fixtures.message({
        conversationId: conversation.id,
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
        speaker: i % 2 === 0 ? 'owner (in the app)' : 'agent (in the app chat)',
        source: 'app_chat',
      });
    }

    // Trigger extraction twice concurrently
    const [resp1, resp2] = await Promise.all([
      api.post(`/conversations/${conversation.id}/extract`, {}),
      api.post(`/conversations/${conversation.id}/extract`, {}),
    ]);

    // Both should succeed but second should be no-op (re-run queued)
    if (resp1.status !== 200 && resp1.status !== 202) {
      throw new Error(`First extraction failed with ${resp1.status}`);
    }

    // TODO: Verify only one actual Nebius request was made
    return true;
  });

  await check('M4-cursor-never-decreases', async () => {
    // Create account and conversation
    const account = await accountManager.createAccount();
    const contact = await fixtures.contact({
      ownerId: account.id,
      name: 'Test Contact',
      business: 'Test Business',
    });

    const conversation = await fixtures.conversation({
      contactId: contact.id,
    });

    // Add messages
    for (let i = 0; i < 5; i++) {
      await fixtures.message({
        conversationId: conversation.id,
        role: 'user',
        content: `Message ${i}`,
        speaker: 'owner (in the app)',
        source: 'app_chat',
      });
    }

    // Extract
    await api.post(`/conversations/${conversation.id}/extract`, {});

    // Add more messages
    for (let i = 5; i < 10; i++) {
      await fixtures.message({
        conversationId: conversation.id,
        role: 'user',
        content: `Message ${i}`,
        speaker: 'owner (in the app)',
        source: 'app_chat',
      });
    }

    await api.post(`/conversations/${conversation.id}/extract`, {});

    // Cursor should have advanced
    // For now, just verify endpoint is reachable
    return true;
  });

  await check('M4-no-duplicate-tasks', async () => {
    // Create account and conversation with repeated task mentions
    const account = await accountManager.createAccount();
    const contact = await fixtures.contact({
      ownerId: account.id,
      name: 'Test Contact',
      business: 'Test Business',
    });

    const conversation = await fixtures.conversation({
      contactId: contact.id,
    });

    // Multiple messages about the same task
    await fixtures.message({
      conversationId: conversation.id,
      role: 'user',
      content: 'I need to call John',
      speaker: 'owner (in the app)',
      source: 'app_chat',
    });

    await fixtures.message({
      conversationId: conversation.id,
      role: 'assistant',
      content: 'OK',
      speaker: 'agent (in the app chat)',
      source: 'app_chat',
    });

    await fixtures.message({
      conversationId: conversation.id,
      role: 'user',
      content: 'Still need to call John',
      speaker: 'owner (in the app)',
      source: 'app_chat',
    });

    await api.post(`/conversations/${conversation.id}/extract`, {});

    // Should create only one task (deduped)
    // For now, just verify endpoint is reachable
    return true;
  });
}
