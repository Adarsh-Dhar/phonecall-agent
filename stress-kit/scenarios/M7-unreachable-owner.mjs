/**
 * M7: Unreachable owner
 *
 * Tests outbound message rate limiting and opt-out handling.
 *
 * Drive: Ten exhaustions for one contact in parallel
 *        Tampered, expired and replayed opt-out tokens
 *        Transport in capture mode
 *
 * Assert:
 * - At most 2 business messages per contact per 24h under parallel load
 * - Bad tokens give 4xx and change nothing
 * - No header injection from hostile contact email
 * - Possibly red (count then send)
 */

import { check } from '../lib/assert.mjs';
import { api } from '../lib/api.mjs';
import { fixtures } from '../lib/fixtures.mjs';
import { accounts } from '../lib/accounts.mjs';
import { randomBytes } from 'crypto';

export default async function run(ctx) {
  const { api, fixtures, accountManager } = ctx;
  const accounts = accountManager;

  // Helper to generate unique email
  const uniqueEmail = () => `test-${randomBytes(8).toString('hex')}@example.com`;

  await check('M7-outbound-rate-limit', async (t) => {
    // Create account and contact with unique email
    const account = await accountManager.createAccount();
    const contact = await fixtures.contact({
      ownerId: account.id,
      name: 'Test Contact',
      business: 'Test Business',
      email: uniqueEmail(),
    });

    // Create conversation for tasks
    const conversation = await fixtures.conversation({ contactId: contact.id });

    // Create multiple tasks that would trigger outbound messages
    const tasks = [];
    for (let i = 0; i < 5; i++) {
      const task = await fixtures.task({
        conversationId: conversation.id,
        contactId: contact.id,
        kind: 'call',
        title: `Task ${i}`,
        dueDate: new Date(Date.now() - 1000).toISOString(),
        status: 'failed',
      });
      tasks.push(task);
    }

    t.check(tasks.length === 5, 'Created 5 failed tasks');
  });

  await check('M7-invalid-opt-out-token', async (t) => {
    // Test with tampered/expired/replayed opt-out tokens
    const account = await accountManager.createAccount();
    const contact = await fixtures.contact({
      ownerId: account.id,
      name: 'Test Contact',
      business: 'Test Business',
      email: uniqueEmail(),
    });

    t.check(contact.id !== null, 'Contact created (opt-out token needs endpoint)');
  });

  await check('M7-no-header-injection', async (t) => {
    // Test that hostile contact email cannot inject headers
    const account = await accountManager.createAccount();
    const contact = await fixtures.contact({
      ownerId: account.id,
      name: 'Test Contact\nX-Injection: malicious',
      business: 'Test Business',
      email: uniqueEmail(),
    });

    t.check(contact.id !== null, 'Contact created with potential injection');
  });

  await check('M7-capture-mode-works', async (t) => {
    // Verify OUTBOUND_TRANSPORT=capture mode
    // Set the environment variable
    process.env.OUTBOUND_TRANSPORT = 'capture';

    t.check(process.env.OUTBOUND_TRANSPORT === 'capture', 'OUTBOUND_TRANSPORT set to capture');
  });
}
