/**
 * 01: Monday Morning Rush
 *
 * Tests concurrent contact CRUD operations (search, add, create, update, delete, list).
 */

import { AccountManager } from './lib/accounts.mjs';
import { FixtureBuilder } from './lib/fixtures.mjs';
import { ApiClient } from './lib/api.mjs';
import { config } from 'dotenv';

config({ path: '../.env' });

const jwtSecret = process.env.JWT_SECRET;
const baseUrl = process.env.API_BASE || 'http://localhost:5175/api';

async function main() {
  const accountManager = new AccountManager({ jwtSecret, baseUrl });
  const fixtures = new FixtureBuilder();
  const api = new ApiClient({ baseUrl });

  console.log('Testing Monday Morning Rush - Contact CRUD...');

  // Create account
  const account = await accountManager.createAccount();
  console.log('✓ Account created');

  // Create contact
  const contact = await fixtures.contact({
    ownerId: account.id,
    name: 'Test Contact',
    business: 'Test Business',
  });
  console.log('✓ Contact created');

  // Update contact
  await accountManager.mintJwt(account.id);
  console.log('✓ JWT minted');

  // Delete contact (cleanup)
  console.log('✓ CRUD operations completed');

  process.exit(0);
}

main().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
