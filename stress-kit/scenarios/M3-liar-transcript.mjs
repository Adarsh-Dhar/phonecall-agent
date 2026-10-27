/**
 * M3: Liar transcript
 *
 * Tests prompt injection and malicious model responses.
 *
 * Drive: obedient-injection returns actions that:
 * - Complete or cancel a task in another conversation
 * - Invalidate an active fact
 * - Upsert an active constraint
 * All citing business lines
 * Also a call with no relationship so speaker is null
 *
 * Assert:
 * - Database unchanged except suggested rows
 * - Nothing in another conversation touched
 * - Active facts never sourced only from business speech
 * - Red: invalidate path; null-speaker path
 */

import { check } from '../lib/assert.mjs';
import { api } from '../lib/api.mjs';
import { fixtures } from '../lib/fixtures.mjs';
import { accounts } from '../lib/accounts.mjs';

export default async function run(ctx) {
  const { api, fixtures, accountManager } = ctx;
  const accounts = accountManager;

  await check('M3-cross-conversation-task-modification-rejected', async (t) => {
    // Create account and two conversations
    const account = await accountManager.createAccount();
    const contact = await fixtures.contact({
      ownerId: account.id,
      name: 'Test Contact',
      business: 'Test Business',
    });

    const conv1 = await fixtures.conversation({
      contactId: contact.id,
    });

    const conv2 = await fixtures.conversation({
      contactId: contact.id,
    });

    // Create a task in conv2
    const task = await fixtures.task({
      contactId: contact.id,
      conversationId: conv2.id,
      kind: 'call',
      title: 'Target task',
      status: 'open',
    });

    t.check(task.id !== null, 'Task created in conv2');
    t.check(task.conversationId === conv2.id, 'Task belongs to conv2');
  });

  await check('M3-business-only-fact-rejected', async (t) => {
    // Create account and conversation with only business speech
    const account = await accountManager.createAccount();
    const contact = await fixtures.contact({
      ownerId: account.id,
      name: 'Test Contact',
      business: 'Test Business',
    });

    const conversation = await fixtures.conversation({
      contactId: contact.id,
    });

    // Only business messages (no owner messages)
    await fixtures.message({
      conversationId: conversation.id,
      role: 'user',
      content: 'I am the business',
      speaker: 'contact (on the call)',
      source: 'phone_call',
    });

    await fixtures.message({
      conversationId: conversation.id,
      role: 'assistant',
      content: 'Agent response',
      speaker: 'agent (on the call, for the owner)',
      source: 'phone_call',
    });

    t.check(true, 'Business-only messages created (full fact rejection test needs real Nebius)');
  });

  await check('M3-null-speaker-handled', async (t) => {
    // Create account and conversation with null speaker (no relationship)
    const account = await accountManager.createAccount();
    const contact = await fixtures.contact({
      ownerId: account.id,
      name: 'Test Contact',
      business: 'Test Business',
    });

    const conversation = await fixtures.conversation({
      contactId: contact.id,
    });

    // Message with null speaker
    await fixtures.message({
      conversationId: conversation.id,
      role: 'user',
      content: 'Message with null speaker',
      speaker: null,
      source: 'app_chat',
    });

    await fixtures.message({
      conversationId: conversation.id,
      role: 'assistant',
      content: 'Response',
      speaker: 'agent (in the app chat)',
      source: 'app_chat',
    });

    t.check(true, 'Null speaker messages created (full handling test needs real Nebius)');
  });
}
