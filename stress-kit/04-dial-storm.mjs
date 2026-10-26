/**
 * Chapter 4: Dial Storm
 * 
 * Hundreds of people call at once, and a few mash the Call button 25 times
 * Tests concurrent call placement and callback task deduplication
 * 
 * Expected failures:
 * 4a: Parallel dials leave more than one ringing call for the same pair
 * 4d: Parallel dials to a closed business create duplicate callback tasks
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
  parallelDials: { count: 0, multipleRinging: 0, success: 0 },
  rapidButtonMash: { count: 0, duplicateCalls: 0, success: 0 },
  closedBusinessDials: { count: 0, duplicateTasks: 0, success: 0 },
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

async function dialCall(token, contactId, taskId = null) {
  const response = await fetch(`${API_BASE}/calls`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `token=${token}`,
    },
    body: JSON.stringify({ contactId, taskId }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Dial failed: ${response.status} - ${JSON.stringify(error)}`);
  }
  return response.json();
}

async function getRingingCalls(individualId, businessId) {
  await client.connect();
  const result = await client.query(`
    SELECT COUNT(*) FROM "Call" 
    WHERE "individualId" = $1 
    AND "businessId" = $2 
    AND status = 'ringing'
  `, [individualId, businessId]);
  await client.end();
  return parseInt(result.rows[0].count);
}

async function checkCallbackTasks(contactId) {
  await client.connect();
  const result = await client.query(`
    SELECT COUNT(*) FROM "Task" 
    WHERE "contactId" = $1 
    AND kind = 'call'
    AND status = 'open'
  `, [contactId]);
  await client.end();
  return parseInt(result.rows[0].count);
}

// Test 4a: Parallel dials may leave multiple ringing calls
async function testParallelDials(individual, business) {
  stats.parallelDials.count++;
  
  let contactId;
  
  console.log(`  [Check 4a] Testing ${individual.id} -> ${business.id}`);
  
  try {
    // Add business as contact
    console.log(`  [Check 4a] Adding business as contact...`);
    const contact = await addContactFromAccount(individual.token, business.id);
    contactId = contact.id;
    console.log(`  [Check 4a] ✓ Contact created (ID: ${contactId})`);
    
    // Fire 5 parallel dial requests
    console.log(`  [Check 4a] Firing 5 parallel dial requests...`);
    const promises = Array.from({ length: 5 }, () =>
      dialCall(individual.token, contactId).catch(e => ({ error: e.message }))
    );
    
    const results = await Promise.all(promises);
    const successful = results.filter(r => !r.error).length;
    console.log(`  [Check 4a] ${successful}/5 dial requests succeeded`);
    
    // Check for multiple ringing calls
    console.log(`  [Check 4a] Checking for multiple ringing calls...`);
    const ringingCount = await getRingingCalls(individual.id, business.id);
    console.log(`  [Check 4a] Found ${ringingCount} ringing call(s)`);
    
    if (ringingCount > 1) {
      stats.parallelDials.multipleRinging++;
      console.log(`  [Check 4a] ⚠️  MULTIPLE RINGING: ${ringingCount} calls for ${individual.id} -> ${business.id}`);
    } else {
      stats.parallelDials.success++;
      console.log(`  [Check 4a] ✓ Single ringing call (correct)`);
    }
    
    // Cleanup calls
    console.log(`  [Check 4a] Cleaning up calls...`);
    await client.connect();
    await client.query(`
      DELETE FROM "Call" 
      WHERE "individualId" = $1 
      AND "businessId" = $2
    `, [individual.id, business.id]);
    await client.end();
    console.log(`  [Check 4a] ✓ Calls cleaned up`);
    
    // Cleanup contact
    await fetch(`${API_BASE}/contacts/${contactId}`, {
      method: 'DELETE',
      headers: { 'Cookie': `token=${individual.token}` },
    });
    console.log(`  [Check 4a] ✓ Contact cleaned up`);
    
  } catch (error) {
    console.log(`  [Check 4a] ✗ Failed: ${error.message}`);
    // Cleanup
    if (contactId) {
      try {
        await fetch(`${API_BASE}/contacts/${contactId}`, {
          method: 'DELETE',
          headers: { 'Cookie': `token=${individual.token}` },
        });
      } catch (e) {}
    }
  }
}

// Test 4b: Rapid button mash (25 dial attempts)
async function testRapidButtonMash(individual, business) {
  stats.rapidButtonMash.count++;
  
  let contactId;
  
  console.log(`  [Check 4b] Testing ${individual.id} -> ${business.id}`);
  
  try {
    const contact = await addContactFromAccount(individual.token, business.id);
    contactId = contact.id;
    console.log(`  [Check 4b] ✓ Contact created (ID: ${contactId})`);
    
    // Fire 25 rapid dial requests
    console.log(`  [Check 4b] Firing 25 rapid dial requests...`);
    const promises = Array.from({ length: 25 }, () =>
      dialCall(individual.token, contactId).catch(e => ({ error: e.message }))
    );
    
    const results = await Promise.all(promises);
    const successful = results.filter(r => !r.error).length;
    console.log(`  [Check 4b] ${successful}/25 dial requests succeeded`);
    
    // Check for duplicate calls
    console.log(`  [Check 4b] Checking for duplicate calls...`);
    await client.connect();
    const result = await client.query(`
      SELECT COUNT(*) FROM "Call" 
      WHERE "contactId" = $1
    `, [contactId]);
    await client.end();
    
    const callCount = parseInt(result.rows[0].count);
    console.log(`  [Check 4b] Found ${callCount} call(s)`);
    
    if (callCount > 1) {
      stats.rapidButtonMash.duplicateCalls++;
      console.log(`  [Check 4b] ⚠️  DUPLICATE CALLS: ${callCount} calls from 25 attempts`);
    } else {
      stats.rapidButtonMash.success++;
      console.log(`  [Check 4b] ✓ Single call (correct)`);
    }
    
    // Cleanup
    console.log(`  [Check 4b] Cleaning up calls...`);
    await client.connect();
    await client.query(`DELETE FROM "Call" WHERE "contactId" = $1`, [contactId]);
    await client.end();
    console.log(`  [Check 4b] ✓ Calls cleaned up`);
    
    await fetch(`${API_BASE}/contacts/${contactId}`, {
      method: 'DELETE',
      headers: { 'Cookie': `token=${individual.token}` },
    });
    console.log(`  [Check 4b] ✓ Contact cleaned up`);
    
  } catch (error) {
    console.log(`  [Check 4b] ✗ Failed: ${error.message}`);
  }
}

// Test 4d: Parallel dials to closed business (duplicate callback tasks)
async function testClosedBusinessDials(individual, business) {
  stats.closedBusinessDials.count++;
  
  let contactId;
  
  console.log(`  [Check 4d] Testing ${individual.id} -> ${business.id}`);
  
  try {
    const contact = await addContactFromAccount(individual.token, business.id);
    contactId = contact.id;
    console.log(`  [Check 4d] ✓ Contact created (ID: ${contactId})`);
    
    // Set business hours to "closed" (current time outside hours)
    console.log(`  [Check 4d] Setting business hours to closed...`);
    await fetch(`${API_BASE}/contacts/${contactId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${individual.token}`,
      },
      body: JSON.stringify({
        businessHoursJson: JSON.stringify({
          days: [1, 2, 3, 4, 5],
          start: 23,
          end: 24,
        }),
      }),
    });
    console.log(`  [Check 4d] ✓ Business hours set to closed`);
    
    // Fire 5 parallel dial attempts (should all fail but might create tasks)
    console.log(`  [Check 4d] Firing 5 parallel dial attempts to closed business...`);
    const promises = Array.from({ length: 5 }, () =>
      dialCall(individual.token, contactId).catch(e => ({ error: e.message }))
    );
    
    await Promise.all(promises);
    console.log(`  [Check 4d] ✓ Dial attempts complete`);
    
    // Check for duplicate callback tasks
    console.log(`  [Check 4d] Checking for duplicate callback tasks...`);
    const taskCount = await checkCallbackTasks(contactId);
    console.log(`  [Check 4d] Found ${taskCount} callback task(s)`);
    
    if (taskCount > 1) {
      stats.closedBusinessDials.duplicateTasks++;
      console.log(`  [Check 4d] ⚠️  DUPLICATE TASKS: ${taskCount} tasks for closed business`);
    } else {
      stats.closedBusinessDials.success++;
      console.log(`  [Check 4d] ✓ Single or zero tasks (correct)`);
    }
    
    // Cleanup
    console.log(`  [Check 4d] Cleaning up tasks...`);
    await client.connect();
    await client.query(`DELETE FROM "Task" WHERE "contactId" = $1`, [contactId]);
    await client.end();
    console.log(`  [Check 4d] ✓ Tasks cleaned up`);
    
    await fetch(`${API_BASE}/contacts/${contactId}`, {
      method: 'DELETE',
      headers: { 'Cookie': `token=${individual.token}` },
    });
    console.log(`  [Check 4d] ✓ Contact cleaned up`);
    
  } catch (error) {
    console.log(`  [Check 4d] ✗ Failed: ${error.message}`);
  }
}

async function runChapter() {
  console.log('='.repeat(80));
  console.log('Chapter 4: Dial Storm');
  console.log('='.repeat(80));
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log('');
  
  const testUsers = Math.min(CONCURRENCY, individuals.length, businesses.length);
  
  console.log('Check 4a: Parallel dials for multiple ringing calls...');
  for (let i = 0; i < Math.min(5, testUsers); i++) {
    await testParallelDials(individuals[i], businesses[i]);
  }
  
  console.log('');
  console.log('Check 4b: Rapid button mash (25 dial attempts)...');
  for (let i = 0; i < Math.min(5, testUsers); i++) {
    await testRapidButtonMash(individuals[i], businesses[i]);
  }
  
  console.log('');
  console.log('Check 4d: Parallel dials to closed business (duplicate tasks)...');
  for (let i = 0; i < Math.min(5, testUsers); i++) {
    await testClosedBusinessDials(individuals[i], businesses[i]);
  }
  
  // Report results
  console.log('');
  console.log('RESULTS');
  console.log('='.repeat(80));
  
  console.log('Check 4a - Parallel Dials:');
  console.log(`  Attempts: ${stats.parallelDials.count}`);
  console.log(`  Multiple ringing calls: ${stats.parallelDials.multipleRinging}`);
  console.log(`  Success (single call): ${stats.parallelDials.success}`);
  
  console.log('');
  console.log('Check 4b - Rapid Button Mash:');
  console.log(`  Attempts: ${stats.rapidButtonMash.count}`);
  console.log(`  Duplicate calls: ${stats.rapidButtonMash.duplicateCalls}`);
  console.log(`  Success (single call): ${stats.rapidButtonMash.success}`);
  
  console.log('');
  console.log('Check 4d - Closed Business Dials:');
  console.log(`  Attempts: ${stats.closedBusinessDials.count}`);
  console.log(`  Duplicate tasks: ${stats.closedBusinessDials.duplicateTasks}`);
  console.log(`  Success (single task): ${stats.closedBusinessDials.success}`);
  
  console.log('');
  console.log('PASS/FAIL CRITERIA');
  console.log('='.repeat(80));
  
  const hasMultipleRinging = stats.parallelDials.multipleRinging > 0;
  const hasDuplicateCalls = stats.rapidButtonMash.duplicateCalls > 0;
  const hasDuplicateTasks = stats.closedBusinessDials.duplicateTasks > 0;
  
  console.log(`Check 4a (multiple ringing): ${hasMultipleRinging ? '⚠️  EXPECTED FAILURE - needs unique index' : '✓ PASS'}`);
  console.log(`Check 4b (duplicate calls): ${hasDuplicateCalls ? '⚠️  EXPECTED FAILURE - needs deduplication' : '✓ PASS'}`);
  console.log(`Check 4d (duplicate tasks): ${hasDuplicateTasks ? '⚠️  EXPECTED FAILURE - needs task deduplication' : '✓ PASS'}`);
  console.log('');
  
  console.log(`Overall: INFORMATIONAL (these are known issues to fix)`);
  console.log('='.repeat(80));
  
  console.log('');
  console.log('FIX PATTERN:');
  console.log('- Add partial unique index: UNIQUE (individualId, businessId) WHERE status = \'ringing\'');
  console.log('- Handle unique violation by returning existing call');
  console.log('- Add task deduplication before creating callback tasks');
  
  process.exit(0); // Always exit 0 since these are expected failures
}

runChapter().catch(err => {
  console.error('Chapter failed:', err);
  process.exit(1);
});
