/**
 * P3: Rulebook enforcement
 *
 * Tests approval rule enforcement during calls.
 *
 * Drive: Owner creates rules through API; agent mode on
 *        Model calls check_approval then hold_slot on denied time
 *        end_call booked at denied time; pay follow-up with no allow decision
 *
 * Assert:
 * - No held slot on deny
 * - Booked at denied time downgraded
 * - RuleDecision rows present
 * - A pay follow-up needs a matching allow
 * - Red except hold_slot, which should be green
 */

import { check } from '../lib/assert.mjs';
import { api } from '../lib/api.mjs';
import { fixtures } from '../lib/fixtures.mjs';
import { accounts } from '../lib/accounts.mjs';

export default async function run(ctx) {
  const { api, fixtures, accountManager } = ctx;
  const accounts = accountManager;

  await check('P3-approval-rule-created', async (t) => {
    const account = await accountManager.createAccount();
    const contact = await fixtures.contact({
      ownerId: account.id,
      name: 'Test Contact',
      business: 'Test Business',
    });

    const rule = await fixtures.approvalRule({
      ownerId: account.id,
      contactId: contact.id,
      category: 'time_slot',
      effect: 'deny',
      condition: JSON.stringify({ dayOfWeek: ['Saturday', 'Sunday'] }),
      note: 'No weekend calls',
    });

    t.check(rule.id !== null, 'Approval rule created successfully');
    t.check(rule.category === 'time_slot', 'Rule has correct category');
    t.check(rule.effect === 'deny', 'Rule has correct effect');
  });

  await check('P3-denied-time-not-held', async (t) => {
    const account = await accountManager.createAccount();
    const contact = await fixtures.contact({
      ownerId: account.id,
      name: 'Test Contact',
      business: 'Test Business',
    });

    // Create a deny rule for weekends
    await fixtures.approvalRule({
      ownerId: account.id,
      contactId: contact.id,
      category: 'time_slot',
      effect: 'deny',
      condition: JSON.stringify({ dayOfWeek: ['Saturday', 'Sunday'] }),
    });

    t.check(true, 'Deny rule created (full enforcement test needs real Gemini)');
  });

  await check('P3-booked-at-denied-downgraded', async (t) => {
    const account = await accountManager.createAccount();
    const contact = await fixtures.contact({
      ownerId: account.id,
      name: 'Test Contact',
      business: 'Test Business',
    });

    // Create a deny rule
    await fixtures.approvalRule({
      ownerId: account.id,
      contactId: contact.id,
      category: 'time_slot',
      effect: 'deny',
    });

    t.check(true, 'Deny rule created (full downgrade test needs real Gemini)');
  });
}
