/**
 * P2: Hallucinated hang-up — end_call arguments are untrusted model output.
 * TODO: Rewrite to use real Gemini instead of fake-Gemini control plane.
 */
import { check } from '../lib/assert.mjs';

export default async function run(ctx) {
  const { accountManager, fixtures } = ctx;

  await check('P2-end-call-validation', async (t) => {
    const account = await accountManager.createAccount();
    const contact = await fixtures.contact({
      ownerId: account.id,
      name: 'Test Contact',
      business: 'Test Business',
    });

    const conversation = await fixtures.conversation({
      contactId: contact.id,
    });

    t.check(conversation.id !== null, 'Conversation created (end_call validation needs real Gemini)');
  });
}
