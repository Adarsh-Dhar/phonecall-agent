/**
 * Cleanup seeded test accounts
 */

import 'dotenv/config';
import pkg from 'pg';
const { Client } = pkg;

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

if (!TEST_DATABASE_URL) {
  console.error('TEST_DATABASE_URL must be set in .env (DATABASE_URL is not a fallback)');
  process.exit(1);
}

// Database safety check: must be localhost and name ends with _test
const dbMatch = TEST_DATABASE_URL.match(/@([^:]+):(\d+)\/([^/]+)/);
if (!dbMatch) {
  console.error('Could not parse TEST_DATABASE_URL');
  process.exit(1);
}

const [, host, port, dbName] = dbMatch;
if (host !== 'localhost' && host !== '127.0.0.1') {
  console.error('TEST_DATABASE_URL must use localhost for safety');
  process.exit(1);
}

if (!dbName.endsWith('_test')) {
  console.error(`Database name must end with '_test' for safety (got: ${dbName})`);
  console.error('This prevents accidental cleanup of production databases');
  process.exit(1);
}

console.log(`Safety check passed: using ${dbName} on localhost:${port}`);

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
  if (fs.existsSync('./tokens.json')) {
    fs.unlinkSync('./tokens.json');
    console.log('✓ Removed tokens.json');
  }

  await client.end();
}

cleanup().catch(err => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
