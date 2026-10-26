/**
 * Cleanup seeded test accounts
 */

import 'dotenv/config';
import pkg from 'pg';
const { Client } = pkg;
import { validateTestConfig, getConfig } from './test-config.mjs';

// Validate configuration before proceeding
validateTestConfig();

const config = getConfig();
const TEST_DATABASE_URL = config.TEST_DATABASE_URL;

const client = new Client(TEST_DATABASE_URL);

async function cleanup() {
  await client.connect();
  console.log('Connected to test database');

  console.log('Cleaning up test accounts...');
  const result = await client.query(`
    DELETE FROM "Account" WHERE email LIKE '%@stress-test.local'
  `);

  console.log(`✓ Deleted ${result.rowCount} test accounts`);

  // Remove tokens file (path relative to script)
  const fs = await import('fs');
  const path = await import('path');
  const __filename = new URL(import.meta.url).pathname;
  const __dirname = path.dirname(__filename);
  const tokensPath = path.join(__dirname, 'tokens.json');

  if (fs.existsSync(tokensPath)) {
    fs.unlinkSync(tokensPath);
    console.log('✓ Removed tokens.json');
  }

  await client.end();
}

cleanup().catch(err => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
