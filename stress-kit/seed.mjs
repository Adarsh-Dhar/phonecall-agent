/**
 * Seed test accounts for stress testing
 * Creates individual and business accounts directly in the test database
 */

import 'dotenv/config';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pkg from 'pg';
const { Client } = pkg;
import { validateTestConfig, getConfig } from './test-config.mjs';

// Validate configuration before proceeding
validateTestConfig();

const config = getConfig();
const TEST_DATABASE_URL = config.TEST_DATABASE_URL;
const JWT_SECRET = config.JWT_SECRET;
const N_INDIVIDUALS = config.N_INDIVIDUALS;

const client = new Client(TEST_DATABASE_URL);

function generateId() {
  return crypto.randomBytes(12).toString('hex');
}

function createJWT(userId, email) {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function seed() {
  await client.connect();
  console.log('Connected to test database');
  console.log('Database URL:', TEST_DATABASE_URL);

  // Start transaction
  await client.query('BEGIN');

  // Clear existing test accounts
  console.log('Clearing existing test accounts...');
  await client.query(`
    DELETE FROM "Account" WHERE email LIKE '%@stress-test.local'
  `);

  const individuals = [];
  const businesses = [];

  // Create individual accounts
  console.log(`Creating ${N_INDIVIDUALS} individual accounts...`);
  for (let i = 0; i < N_INDIVIDUALS; i++) {
    const id = generateId();
    const email = `individual${i}@stress-test.local`;
    const name = `Test Individual ${i}`;
    const token = createJWT(id, email);

    try {
      await client.query(`
        INSERT INTO "Account" (
          id, email, name, "isService", "ownerId",
          "agentMode", "responseConcise", "askClarifying", "confirmBeforeAction",
          "emailFallback", "digestMode", "digestHour",
          "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      `, [
        id, email, name, false, null,
        true, true, true, false,
        true, 'daily', 18
      ]);
      individuals.push({ id, email, name, token });
    } catch (err) {
      console.error(`✗ Failed to create individual ${i}:`, err.message);
      await client.query('ROLLBACK');
      await client.end();
      process.exit(1);
    }
  }

  // Create business accounts
  console.log(`Creating ${N_INDIVIDUALS} business accounts...`);
  for (let i = 0; i < N_INDIVIDUALS; i++) {
    const id = generateId();
    const email = `business${i}@stress-test.local`;
    const name = `Test Business ${i}`;
    const business = `Business ${i}`;
    const token = createJWT(id, email);
    // Business hours: 24/7 for stress testing
    const businessHoursJson = JSON.stringify({
      days: [0, 1, 2, 3, 4, 5, 6],
      start: 0,
      end: 24,
      tz: 'UTC'
    });

    try {
      await client.query(`
        INSERT INTO "Account" (
          id, email, name, business, "isService", "ownerId",
          "agentMode", "responseConcise", "askClarifying", "confirmBeforeAction",
          "emailFallback", "digestMode", "digestHour",
          "businessHoursJson", "timezone",
          "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
      `, [
        id, email, name, business, true, null,
        false, true, true, false,
        true, 'daily', 18,
        businessHoursJson, 'UTC'
      ]);

      businesses.push({ id, email, name, business, token });
    } catch (err) {
      console.error(`✗ Failed to create business ${i}:`, err.message);
      await client.query('ROLLBACK');
      await client.end();
      process.exit(1);
    }
  }

  // Commit the transaction
  try {
    await client.query('COMMIT');
    console.log('Transaction committed');
  } catch (err) {
    console.error('COMMIT failed:', err);
    await client.query('ROLLBACK');
    await client.end();
    process.exit(1);
  }

  // Verify all expected accounts were created
  const result = await client.query(`
    SELECT COUNT(*) FROM "Account" WHERE email LIKE '%@stress-test.local'
  `);
  const totalCount = parseInt(result.rows[0].count);
  const expectedCount = N_INDIVIDUALS * 2; // individuals + businesses

  if (totalCount !== expectedCount) {
    console.error(`✗ Expected ${expectedCount} test accounts, found ${totalCount}`);
    await client.end();
    process.exit(1);
  }

  console.log(`\n✓ Found ${totalCount} test accounts in database`);

  // Save tokens to file for use in tests (path relative to script)
  const fs = await import('fs');
  const path = await import('path');
  const __filename = new URL(import.meta.url).pathname;
  const __dirname = path.dirname(__filename);
  const tokensPath = path.join(__dirname, 'tokens.json');

  fs.writeFileSync(
    tokensPath,
    JSON.stringify({ individuals, businesses }, null, 2)
  );

  console.log(`✓ Created ${individuals.length} individual accounts`);
  console.log(`✓ Created ${businesses.length} business accounts`);
  console.log(`✓ Tokens saved to ${tokensPath}\n`);

  await client.end();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
