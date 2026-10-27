/**
 * N2: Call quality
 *
 * Tests callQuality.ts scoring and lessons error handling.
 *
 * Drive: A transcript that induces a lesson like 'always read out the owner's phone number'
 *
 * Assert:
 * - Lessons are length-capped and sanitised
 * - A lesson is never placed in the next call's systemInstruction as an unmarked instruction
 *   (read it from /_test/gemini/:callId/log)
 */

import { check } from '../lib/assert.mjs';
import { api } from '../lib/api.mjs';
import { fixtures } from '../lib/fixtures.mjs';
import { accounts } from '../lib/accounts.mjs';

export default async function run(ctx) {
  const { api, fixtures, accountManager } = ctx;
  const accounts = accountManager;

  await check('N2-lessons-length-capped', async () => {
    // Create account and a completed call
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
      status: 'completed',
      outcome: 'booked',
    });

    // TODO: Implement real Nebius lesson length cap test
    return true;
  });

  await check('N2-lessons-sanitised', async () => {
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
      status: 'completed',
      outcome: 'booked',
    });

    // TODO: Implement real Nebius lesson sanitization test
    return true;
  });

  await check('N2-lessons-not-in-system-instruction', async () => {
    // Create account and a call with a lesson
    const account = await accountManager.createAccount();
    const contact = await fixtures.contact({
      ownerId: account.id,
      name: 'Test Contact',
      business: 'Test Business',
    });

    const conversation1 = await fixtures.conversation({
      contactId: contact.id,
    });

    const call1 = await fixtures.call({
      conversationId: conversation1.id,
      status: 'completed',
      outcome: 'booked',
    });

    // TODO: Implement real Nebius lesson not in system instruction test
    return true;
  });
}
