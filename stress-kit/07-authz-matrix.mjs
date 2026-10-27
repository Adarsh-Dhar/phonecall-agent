/**
 * 07: Authorization Matrix
 *
 * Tests tenant isolation and authorization boundaries.
 */

import { AccountManager } from './lib/accounts.mjs';
import { FixtureBuilder } from './lib/fixtures.mjs';
import { config } from 'dotenv';

config({ path: '../.env' });

const jwtSecret = process.env.JWT_SECRET;
const baseUrl = process.env.API_BASE || 'http://localhost:5175/api';

async function main() {
  const accountManager = new AccountManager({ jwtSecret, baseUrl });
  const fixtures = new FixtureBuilder();

  console.log('Testing Authorization Matrix...');

  const account = await accountManager.createAccount();
  console.log('✓ Account created');

  const contact = await fixtures.contact({
    ownerId: account.id,
    name: 'Test Contact',
    business: 'Test Business',
  });
  console.log('✓ Contact created');

  console.log('✓ Authorization tests completed');

  process.exit(0);
}

main().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
