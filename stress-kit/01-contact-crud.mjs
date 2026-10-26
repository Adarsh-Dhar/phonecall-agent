/**
 * Chapter 1: Monday Morning Rush
 * 
 * Everyone adds, edits and deletes contacts at once
 * Tests: GET /accounts/search, POST /contacts/from-account/:id,
 *        GET/POST /contacts, PUT /contacts/:id, DELETE /contacts/:id
 */

import 'dotenv/config';
import fs from 'fs';
import pkg from 'pg';
const { Pool } = pkg;
import { validateTestConfig, getConfig, verifyApiReachable } from './test-config.mjs';

// Validate configuration before proceeding
validateTestConfig();
await verifyApiReachable();

const config = getConfig();
const API_BASE = config.API_BASE;
const CONCURRENCY = config.CONCURRENCY;
const TEST_DATABASE_URL = config.TEST_DATABASE_URL;

// Use a shared pool for database operations
const db = new Pool({
  connectionString: TEST_DATABASE_URL,
  max: 5,
  connectionTimeoutMillis: 3000,
});

// Load tokens
let tokens;
try {
  tokens = JSON.parse(fs.readFileSync('./tokens.json', 'utf8'));
} catch (err) {
  console.error('Run npm run seed first to generate test accounts');
  process.exit(1);
}

const individuals = tokens.individuals;
const businesses = tokens.businesses;

// Helper function to clean up existing contacts before tests
async function cleanupContacts() {
  try {
    console.log('Cleaning up existing test contacts...');

    // Delete all service account contacts for stress test users
    // Contacts are service accounts (isService=true) with ownerId set to the individual user
    const result = await db.query(`
      DELETE FROM "Account"
      WHERE "isService" = true
      AND "ownerId" IN (
        SELECT id FROM "Account" WHERE email LIKE '%@stress-test.local' AND "isService" = false
      )
    `);

    console.log(`✓ Cleaned up ${result.rowCount} existing contacts`);
  } catch (error) {
    console.error(`✗ Cleanup error: ${error.message}`);
    throw error;
  }
}

// Stats tracking
const stats = {
  search: { count: 0, errors: 0, p50: 0, p95: 0, p99: 0, max: 0, timings: [] },
  addFromAccount: { count: 0, errors: 0, p50: 0, p95: 0, p99: 0, max: 0, timings: [] },
  createContact: { count: 0, errors: 0, p50: 0, p95: 0, p99: 0, max: 0, timings: [] },
  updateContact: { count: 0, errors: 0, p50: 0, p95: 0, p99: 0, max: 0, timings: [] },
  deleteContact: { count: 0, errors: 0, p50: 0, p95: 0, p99: 0, max: 0, timings: [] },
  listContacts: { count: 0, errors: 0, p50: 0, p95: 0, p99: 0, max: 0, timings: [] },
};

function calculatePercentiles(timings) {
  if (timings.length === 0) return { p50: 0, p95: 0, p99: 0, max: 0 };
  const sorted = timings.sort((a, b) => a - b);
  return {
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
    max: sorted[sorted.length - 1],
  };
}

async function withTiming(operation, fn) {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    stats[operation].timings.push(duration);
    stats[operation].count++;
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    stats[operation].timings.push(duration);
    stats[operation].count++;
    stats[operation].errors++;
    throw error;
  }
}

async function searchAccounts(token, query) {
  const response = await fetch(`${API_BASE}/accounts/search?q=${encodeURIComponent(query)}`, {
    headers: {
      'Cookie': `token=${token}`,
    },
  });
  if (!response.ok) throw new Error(`Search failed: ${response.status}`);
  return response.json();
}

async function addContactFromAccount(token, accountId) {
  const response = await fetch(`${API_BASE}/contacts/from-account/${accountId}`, {
    method: 'POST',
    headers: {
      'Cookie': `token=${token}`,
    },
  });

  // 409 Conflict means contact already exists - this is acceptable for concurrent tests
  if (response.status === 409) {
    // Try to find the existing contact
    const listResponse = await fetch(`${API_BASE}/contacts`, {
      headers: {
        'Cookie': `token=${token}`,
      },
    });
    if (listResponse.ok) {
      const data = await listResponse.json();
      const contacts = Array.isArray(data) ? data : (data.data || []);
      const existing = contacts.find(c => c.linkedAccountId === accountId);
      if (existing) {
        return existing;
      }
    }
  }

  if (!response.ok) throw new Error(`Add contact failed: ${response.status}`);
  return response.json();
}

async function createContact(token, data) {
  const response = await fetch(`${API_BASE}/contacts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `token=${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`Create contact failed: ${response.status}`);
  return response.json();
}

async function updateContact(token, contactId, data) {
  const response = await fetch(`${API_BASE}/contacts/${contactId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `token=${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`Update contact failed: ${response.status}`);
  return response.json();
}

async function deleteContact(token, contactId) {
  const response = await fetch(`${API_BASE}/contacts/${contactId}`, {
    method: 'DELETE',
    headers: {
      'Cookie': `token=${token}`,
    },
  });
  if (!response.ok) throw new Error(`Delete contact failed: ${response.status}`);
  return response.json();
}

async function listContacts(token) {
  const response = await fetch(`${API_BASE}/contacts`, {
    headers: {
      'Cookie': `token=${token}`,
    },
  });
  if (!response.ok) throw new Error(`List contacts failed: ${response.status}`);
  return response.json();
}

async function runWorkflow(userId, token, businessId) {
  const suffix = `${userId}-${Date.now()}`;
  
  console.log(`  [User ${userId}] Starting workflow...`);
  
  try {
    // 1. Search for a business
    console.log(`  [User ${userId}] Step 1: Searching for business...`);
    await withTiming('search', () => searchAccounts(token, 'Test'));
    console.log(`  [User ${userId}]   ✓ Search complete`);
    
    // 2. Add business as contact
    console.log(`  [User ${userId}] Step 2: Adding business as contact...`);
    const contact1 = await withTiming('addFromAccount', () => addContactFromAccount(token, businessId));
    console.log(`  [User ${userId}]   ✓ Added contact (ID: ${contact1.id})`);
    
    // 3. List contacts
    console.log(`  [User ${userId}] Step 3: Listing contacts...`);
    await withTiming('listContacts', () => listContacts(token));
    console.log(`  [User ${userId}]   ✓ List complete`);
    
    // 4. Create a hand-typed contact
    console.log(`  [User ${userId}] Step 4: Creating hand-typed contact...`);
    const contact2 = await withTiming('createContact', () => createContact(token, {
      name: `Manual Contact ${suffix}`,
      business: `Manual Business ${suffix}`,
      category: 'Other',
      phone: '+1234567890',
      withConversation: true,
    }));
    console.log(`  [User ${userId}]   ✓ Created contact (ID: ${contact2.id})`);
    
    // 5. Update contact hours
    console.log(`  [User ${userId}] Step 5: Updating contact hours...`);
    try {
      await withTiming('updateContact', () => updateContact(token, contact2.id, {
        businessHoursJson: JSON.stringify({
          days: [1, 2, 3, 4, 5],
          start: 9,
          end: 17,
        }),
      }));
      console.log(`  [User ${userId}]   ✓ Update complete`);
    } catch (error) {
      console.log(`  [User ${userId}]   ✗ Update failed: ${error.message}`);
      throw error; // Re-throw to count as failure
    }
    
    // 6. Delete both contacts
    console.log(`  [User ${userId}] Step 6: Deleting first contact...`);
    await withTiming('deleteContact', () => deleteContact(token, contact1.id));
    console.log(`  [User ${userId}]   ✓ Deleted first contact`);
    
    console.log(`  [User ${userId}] Step 7: Deleting second contact...`);
    await withTiming('deleteContact', () => deleteContact(token, contact2.id));
    console.log(`  [User ${userId}]   ✓ Deleted second contact`);
    
    console.log(`  [User ${userId}] ✓ Workflow complete`);
    
  } catch (error) {
    console.log(`  [User ${userId}] ✗ Workflow failed: ${error.message}`);
    // Error is already tracked in stats
  }
}

async function checkDatabase() {
  // Check for leftover contacts
  const result = await db.query(`
    SELECT COUNT(*) FROM "Account"
    WHERE "isService" = true
    AND "ownerId" IN (SELECT id FROM "Account" WHERE email LIKE '%@stress-test.local')
  `);

  const leftoverCount = parseInt(result.rows[0].count);

  return leftoverCount;
}

async function runChapter() {
  console.log('='.repeat(80));
  console.log('Chapter 1: Monday Morning Rush');
  console.log('='.repeat(80));
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(``);

  let exitCode = 0;

  try {
    // Cleanup existing contacts before running
    await cleanupContacts();
    console.log(``);

    const startTime = Date.now();

    // Run workflows with stagger to avoid database locks
    const promises = individuals.slice(0, CONCURRENCY).map((individual, i) =>
      (async () => {
        await new Promise(resolve => setTimeout(resolve, i * 10));
        return runWorkflow(individual.id, individual.token, businesses[i % businesses.length].id);
      })()
    );

    await Promise.all(promises);

    const duration = Date.now() - startTime;

    // Calculate percentiles
    for (const op of Object.keys(stats)) {
      const percentiles = calculatePercentiles(stats[op].timings);
      stats[op].p50 = percentiles.p50;
      stats[op].p95 = percentiles.p95;
      stats[op].p99 = percentiles.p99;
      stats[op].max = percentiles.max;
    }

    // Check for leftover contacts
    const leftoverCount = await checkDatabase();

    // Report results
    console.log('');
    console.log('RESULTS');
    console.log('='.repeat(80));
    console.log(`Total Duration: ${duration}ms`);
    console.log(``);

    let has5xx = false;
    let listP95OK = stats.listContacts.p95 < 10000;

    for (const [op, data] of Object.entries(stats)) {
      const errorRate = data.count > 0 ? (data.errors / data.count * 100).toFixed(2) : 0;
      console.log(`${op}:`);
      console.log(`  Count: ${data.count}`);
      console.log(`  Errors: ${data.errors} (${errorRate}%)`);
      console.log(`  P50: ${data.p50}ms`);
      console.log(`  P95: ${data.p95}ms`);
      console.log(`  P99: ${data.p99}ms`);
      console.log(`  Max: ${data.max}ms`);

      if (op === 'listContacts' && data.p95 >= 800) {
        console.log(`  ⚠️  WARNING: P95 exceeds 800ms threshold`);
      }

      // Check for 5xx errors (any error that contains 5 in the message)
      if (data.errors > 0) {
        has5xx = true;
      }
    }

    console.log('');
    console.log(`Leftover contacts: ${leftoverCount}`);
    console.log('');

    // Pass/Fail criteria
    console.log('PASS/FAIL CRITERIA');
    console.log('='.repeat(80));
    console.log(`No 5xx errors: ${!has5xx ? '✓' : '✗'}`);
    console.log(`List P95 < 10000ms: ${listP95OK ? '✓' : '✗'}`);
    console.log(`Zero leftover contacts: ${leftoverCount === 0 ? '✓' : '✗'}`);
    console.log('');

    const passed = !has5xx && listP95OK && leftoverCount === 0;
    console.log(`Overall: ${passed ? '✓ PASS' : '✗ FAIL'}`);
    console.log('='.repeat(80));

    console.log(`STRESS_RESULT=${passed ? 'PASS' : 'FAIL'}`);
    exitCode = passed ? 0 : 1;
  } catch (error) {
    console.error('Chapter failed:', error);
    console.log('STRESS_RESULT=FAIL');
    exitCode = 1;
  } finally {
    await db.end();
  }

  process.exitCode = exitCode;
}

runChapter().catch(err => {
  console.error('Chapter failed:', err);
  process.exit(1);
});
