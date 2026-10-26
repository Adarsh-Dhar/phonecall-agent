/**
 * Seed test accounts for stress testing
 * Creates individual and business accounts directly in the test database
 */

import 'dotenv/config';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pkg from 'pg';
const { Client } = pkg;

const TEST_DATABASE_URL = process.env.DATABASE_URL || process.env.TEST_DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET;
const N_INDIVIDUALS = Number(process.env.N_INDIVIDUALS) || 20;

if (!TEST_DATABASE_URL) {
  console.error('TEST_DATABASE_URL or DATABASE_URL not set in .env');
  process.exit(1);
}

if (!JWT_SECRET) {
  console.error('JWT_SECRET not set in .env');
  process.exit(1);
}

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
        id, email, name, false, id,
        true, true, true, false,
        true, 'daily', 18
      ]);
      individuals.push({ id, email, name, token });
    } catch (err) {
      console.error(`Failed to create individual ${i}:`, err.message);
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

    await client.query(`
      INSERT INTO "Account" (
        id, email, name, business, "isService", "ownerId",
        "agentMode", "responseConcise", "askClarifying", "confirmBeforeAction",
        "emailFallback", "digestMode", "digestHour",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
    `, [
      id, email, name, business, true, null,
      false, true, true, false,
      true, 'daily', 18
    ]);

    businesses.push({ id, email, name, business, token });
  }

  // Commit the transaction
  await client.query('COMMIT');

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

  // Verify accounts were created
  const result = await client.query(`
    SELECT COUNT(*) FROM "Account" WHERE email LIKE '%@stress-test.local'
  `);
  console.log(`\n✓ Found ${result.rows[0].count} test accounts in database`);

  // Save tokens to file for use in tests
  const fs = await import('fs');
  fs.writeFileSync(
    './tokens.json',
    JSON.stringify({ individuals, businesses }, null, 2)
  );

  console.log(`✓ Created ${individuals.length} individual accounts`);
  console.log(`✓ Created ${businesses.length} business accounts`);
  console.log(`✓ Tokens saved to tokens.json\n`);

  await client.end();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
