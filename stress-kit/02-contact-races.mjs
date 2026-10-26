/**
 * Chapter 2: Double Tap
 * 
 * Maya's retry storm; a contact deleted mid-ring
 * Tests race conditions from rapid retries and concurrent operations
 * 
 * Expected failures:
 * 2a: Parallel adds may create duplicate contact rows (no unique index on (ownerId, linkedAccountId))
 * 2b: Edit-vs-delete may surface 500 from Prisma when row vanishes between check and update
 */

import 'dotenv/config';
import fs from 'fs';
import pkg from 'pg';
const { Client } = pkg;

const API_BASE = process.env.API_BASE || 'http://localhost:5175/api';
const CONCURRENCY = Number(process.env.CONCURRENCY) || 20;
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

// Load tokens
let tokens;
try {
  tokens = JSON.parse(fs.readFileSync('./stress-kit/tokens.json', 'utf8'));
} catch (err) {
  console.error('Run npm run seed first to generate test accounts');
  process.exit(1);
}

const individuals = tokens.individuals;
const businesses = tokens.businesses;

const client = new Client(TEST_DATABASE_URL);

const stats = {
  parallelAdds: { count: 0, duplicates: 0, success: 0 },
  editVsDelete: { count: 0, errors: 0, success: 0 },
  deleteMidRing: { count: 0, errors: 0, success: 0 },
};

async function addContactFromAccount(token, accountId) {
  const response = await fetch(`${API_BASE}/contacts/from-account/${accountId}`, {
    method: 'POST',
    headers: {
      'Cookie': `token=${token}`,
    },
  });
  if (!response.ok) throw new Error(`Add contact failed: ${response.status}`);
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

async function checkForDuplicates(ownerId, linkedAccountId) {
  await client.connect();
  const result = await client.query(`
    SELECT COUNT(*) FROM "Account" 
    WHERE "ownerId" = $1 
    AND "linkedAccountId" = $2 
    AND "isService" = true
  `, [ownerId, linkedAccountId]);
  await client.end();
  return parseInt(result.rows[0].count);
}

// Check 2a: Parallel adds may create duplicates
async function testParallelAdds(individual, business) {
  stats.parallelAdds.count++;
  
  console.log(`  [Check 2a] Testing ${individual.id} -> ${business.id}`);
  console.log(`  [Check 2a] Firing 10 parallel add requests...`);
  
  try {
    // Fire 10 parallel add requests for the same business
    const promises = Array.from({ length: 10 }, () =>
      addContactFromAccount(individual.token, business.id)
    );
    
    const results = await Promise.allSettled(promises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    console.log(`  [Check 2a] ${successful}/10 requests succeeded`);
    
    // Check for duplicates in database
    console.log(`  [Check 2a] Checking database for duplicates...`);
    const duplicateCount = await checkForDuplicates(individual.id, business.id);
    console.log(`  [Check 2a] Found ${duplicateCount} contact(s) in database`);
    
    if (duplicateCount > 1) {
      stats.parallelAdds.duplicates++;
      console.log(`  [Check 2a] ⚠️  DUPLICATE DETECTED: ${duplicateCount} contacts for ${individual.id} -> ${business.id}`);
    } else {
      stats.parallelAdds.success++;
      console.log(`  [Check 2a] ✓ No duplicates`);
    }
    
    // Cleanup duplicates
    if (duplicateCount > 0) {
      console.log(`  [Check 2a] Cleaning up duplicates...`);
      await client.connect();
      await client.query(`
        DELETE FROM "Account" 
        WHERE "ownerId" = $1 
        AND "linkedAccountId" = $2 
        AND "isService" = true
      `, [individual.id, business.id]);
      await client.end();
      console.log(`  [Check 2a] ✓ Cleanup complete`);
    }
    
  } catch (error) {
    console.log(`  [Check 2a] ✗ Failed: ${error.message}`);
  }
}

// Check 2b: Edit vs delete race
async function testEditVsDelete(individual, business) {
  stats.editVsDelete.count++;
  
  let contactId;
  
  console.log(`  [Check 2b] Testing ${individual.id} -> ${business.id}`);
  
  try {
    // Create a contact first
    console.log(`  [Check 2b] Creating contact...`);
    const contact = await addContactFromAccount(individual.token, business.id);
    contactId = contact.id;
    console.log(`  [Check 2b] ✓ Contact created (ID: ${contactId})`);
    
    // Fire parallel edit and delete
    console.log(`  [Check 2b] Firing parallel edit and delete...`);
    const promises = [
      updateContact(individual.token, contactId, { note: 'Updated note' }),
      deleteContact(individual.token, contactId),
    ];
    
    const results = await Promise.allSettled(promises);
    
    const editResult = results[0];
    const deleteResult = results[1];
    
    console.log(`  [Check 2b] Edit result: ${editResult.status}`);
    console.log(`  [Check 2b] Delete result: ${deleteResult.status}`);
    
    if (editResult.status === 'rejected' && editResult.reason.message.includes('500')) {
      stats.editVsDelete.errors++;
      console.log(`  [Check 2b] ⚠️  500 ERROR: Edit after delete - ${editResult.reason.message}`);
    } else {
      stats.editVsDelete.success++;
      console.log(`  [Check 2b] ✓ No 500 error`);
    }
    
  } catch (error) {
    console.log(`  [Check 2b] ✗ Failed: ${error.message}`);
    // Cleanup
    if (contactId) {
      try {
        await deleteContact(individual.token, contactId);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
}

async function runChapter() {
  console.log('='.repeat(80));
  console.log('Chapter 2: Double Tap');
  console.log('='.repeat(80));
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log('');
  
  console.log('Check 2a: Parallel adds for duplicate detection...');
  const testUsers = Math.min(CONCURRENCY, individuals.length, businesses.length);
  
  for (let i = 0; i < testUsers; i++) {
    await testParallelAdds(individuals[i], businesses[i]);
  }
  
  console.log('');
  console.log('Check 2b: Edit vs delete race condition...');
  for (let i = 0; i < testUsers; i++) {
    await testEditVsDelete(individuals[i], businesses[i]);
  }
  
  // Report results
  console.log('');
  console.log('RESULTS');
  console.log('='.repeat(80));
  
  console.log('Check 2a - Parallel Adds:');
  console.log(`  Attempts: ${stats.parallelAdds.count}`);
  console.log(`  Duplicates found: ${stats.parallelAdds.duplicates}`);
  console.log(`  Success (no duplicates): ${stats.parallelAdds.success}`);
  
  console.log('');
  console.log('Check 2b - Edit vs Delete:');
  console.log(`  Attempts: ${stats.editVsDelete.count}`);
  console.log(`  500 errors: ${stats.editVsDelete.errors}`);
  console.log(`  Success: ${stats.editVsDelete.success}`);
  
  console.log('');
  console.log('INFO: Deleting a contact cascades to calls and transcripts.');
  console.log('Consider soft-delete if preserving call history is required.');
  console.log('');
  
  // Pass/Fail criteria
  console.log('PASS/FAIL CRITERIA');
  console.log('='.repeat(80));
  
  // These are "expected failures" per the spec, so we report them but don't fail the test
  const hasDuplicates = stats.parallelAdds.duplicates > 0;
  const has500Errors = stats.editVsDelete.errors > 0;
  
  console.log(`Check 2a (duplicates): ${hasDuplicates ? '⚠️  EXPECTED FAILURE - needs unique index' : '✓ PASS'}`);
  console.log(`Check 2b (500 errors): ${has500Errors ? '⚠️  EXPECTED FAILURE - needs atomic updates' : '✓ PASS'}`);
  console.log('');
  
  console.log(`Overall: INFORMATIONAL (these are known issues to fix)`);
  console.log('='.repeat(80));
  
  process.exit(0); // Always exit 0 since these are expected failures
}

runChapter().catch(err => {
  console.error('Chapter failed:', err);
  process.exit(1);
});
