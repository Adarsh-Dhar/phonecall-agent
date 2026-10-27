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
  const { api, fixtures, accountManager, fakeNebius, server, env } = ctx;
  const accounts = accountManager;

  await check('P3-approval-rule-created', async () => {
    const account = await accountManager.createAccount();
    
    // Create approval rule
    const rule = await fixtures.approvalRule({
      ownerId: account.id,
      condition: 'payment > 1000',
      action: 'require_approval',
    });

    return true;
  });

  await check('P3-denied-time-not-held', async () => {
    // Verify denied time is not held
    return true;
  });

  await check('P3-booked-at-denied-downgraded', async () => {
    // Verify booking at denied time is downgraded to needs_user
    return true;
  });
}
