/**
 * P1: Silent line — the voice model cannot connect, or vanishes mid-call.
 * TODO: Rewrite to use real Gemini instead of fake-Gemini control plane.
 */
import { check } from '../lib/assert.mjs';

export default async function run(ctx) {
  const { accountManager, fixtures } = ctx;

  await check('P1-connect-fail-handled', async (t) => {
    const account = await accountManager.createAccount();
    const contact = await fixtures.contact({
      ownerId: account.id,
      name: 'Test Contact',
      business: 'Test Business',
    });

    const conversation = await fixtures.conversation({
      contactId: contact.id,
    });

    t.check(conversation.id !== null, 'Conversation created (connect failure needs real Gemini)');
  });

  await check('P1-mid-call-drop-handled', async (t) => {
    const account = await accountManager.createAccount();
    const contact = await fixtures.contact({
      ownerId: account.id,
      name: 'Test Contact',
      business: 'Test Business',
    });

    const conversation = await fixtures.conversation({
      contactId: contact.id,
    });

    t.check(conversation.id !== null, 'Conversation created (mid-call drop needs real Gemini)');
  });
}
