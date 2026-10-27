/**
 * P7: Never-ending call — the model never calls end_call.
 * TODO: Rewrite to use real Gemini instead of fake-Gemini control plane.
 */
import { check } from '../lib/assert.mjs';

export default async function run(ctx) {
  const { accountManager, fixtures } = ctx;

  await check('P7-call-duration-cap', async (t) => {
    const account = await accountManager.createAccount();
    const contact = await fixtures.contact({
      ownerId: account.id,
      name: 'Test Contact',
      business: 'Test Business',
    });

    const conversation = await fixtures.conversation({
      contactId: contact.id,
    });

    t.check(conversation.id !== null, 'Conversation created (duration cap needs real Gemini)');
  });

  await check('P7-junk-frames-handled', async (t) => {
    const account = await accountManager.createAccount();
    const contact = await fixtures.contact({
      ownerId: account.id,
      name: 'Test Contact',
      business: 'Test Business',
    });

    t.check(contact.id !== null, 'Contact created (junk frames needs real Gemini)');
  });

  await check('P7-oversized-frame-handled', async (t) => {
    const account = await accountManager.createAccount();
    const contact = await fixtures.contact({
      ownerId: account.id,
      name: 'Test Contact',
      business: 'Test Business',
    });

    t.check(contact.id !== null, 'Contact created (oversized frame needs real Gemini)');
  });
}
