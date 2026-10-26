/**
 * Cleanup seeded test accounts
 */

import 'dotenv/config';
import pkg from 'pg';
const { Client } = pkg;

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

if (!TEST_DATABASE_URL) {
  console.error('TEST_DATABASE_URL not set in .env');
  process.exit(1);
}

const client = new Client(TEST_DATABASE_URL);

async function cleanup() {
  await client.connect();
  console.log('Connected to test database');

  console.log('Cleaning up test accounts...');
  const result = await client.query(`
    DELETE FROM "Account" WHERE email LIKE '%@stress-test.local'
  `);

  console.log(`✓ Deleted ${result.rowCount} test accounts`);

  // Remove tokens file
  const fs = await import('fs');
  if (fs.existsSync('./stress-kit/tokens.json')) {
    fs.unlinkSync('./stress-kit/tokens.json');
    console.log('✓ Removed tokens.json');
  }

  await client.end();
}

cleanup().catch(err => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
