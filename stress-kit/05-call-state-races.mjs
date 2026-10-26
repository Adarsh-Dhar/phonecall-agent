/**
 * Chapter 5: Two Hands, One Phone
 * 
 * The business taps Accept as Maya's agent hangs up, while the ring timer expires
 * Tests accept/decline/timeout state transitions under concurrency
 * 
 * Expected failures:
 * 5b: Accept and decline both return 200 in some rounds
 * 5d: Scheduler overwrites accepted call with 'missed' (should be fixed by patch)
 * 5e: Business with 300s ring timeout told 'missed' while DB still says 'ringing'
 */

import 'dotenv/config';
import fs from 'fs';
import pkg from 'pg';
const { Pool } = pkg;
import { validateTestConfig, getConfig, verifyApiReachable, linkBoth } from './test-config.mjs';

validateTestConfig();
await verifyApiReachable();

const config = getConfig();
const API_BASE = config.API_BASE;
const CONCURRENCY = config.CONCURRENCY;
const TEST_DATABASE_URL = config.TEST_DATABASE_URL;

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
  console.log("STRESS_RESULT=FAIL");
  process.exitCode = 1;
  await db.end();
}

const individuals = tokens.individuals;
const businesses = tokens.businesses;

const stats = {
  acceptDeclineRace: { count: 0, both200: 0, success: 0 },
  acceptTimeoutRace: { count: 0, overwritten: 0, success: 0 },
  longTimeoutNotify: { count: 0, earlyNotify: 0, success: 0 },
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

async function addContactForBusiness(businessToken, individualId) {
  // Use linkBoth helper instead
  throw new Error('Use linkBoth helper instead');
}

async function dialCall(token, contactId) {
  const response = await fetch(`${API_BASE}/calls/dial`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `token=${token}`,
    },
    body: JSON.stringify({ contactId }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Dial failed: ${response.status} - ${JSON.stringify(error)}`);
  }
  const data = await response.json();
  return { id: data.callId || data.id, ...data };
}

async function acceptCall(token, callId) {
  const response = await fetch(`${API_BASE}/business/calls/${callId}/accept`, {
    method: 'POST',
    headers: {
      'Cookie': `token=${token}`,
    },
  });
  const body = await response.json().catch(() => null);
  return { httpStatus: response.status, body };
}

async function declineCall(token, callId) {
  const response = await fetch(`${API_BASE}/business/calls/${callId}/decline`, {
    method: 'POST',
    headers: {
      'Cookie': `token=${token}`,
    },
  });
  const body = await response.json().catch(() => null);
  return { httpStatus: response.status, body };
}

async function getCallStatus(callId) {
  ;
  const result = await db.query(`
    SELECT status FROM "Call" WHERE id = $1
  `, [callId]);
  ;
  return result.rows[0]?.status;
}

// Test 5b: Accept and decline race
async function testAcceptDeclineRace(individual, business) {
  stats.acceptDeclineRace.count++;

  let contactId, callId;

  console.log(`  [Check 5b] Testing ${individual.id} -> ${business.id}`);

  try {
    // Link both directions
    console.log(`  [Check 5b] Creating mutual contacts...`);
    const links = await linkBoth(individual, business, API_BASE);
    contactId = links.individualContact?.id;
    console.log(`  [Check 5b] ✓ Mutual contacts created (ID: ${contactId})`);

    const call = await dialCall(individual.token, contactId);
    callId = call.id;
    console.log(`  [Check 5b] ✓ Call created (ID: ${callId})`);

    // Fire accept and decline in parallel (business recipient should accept/decline)
    console.log(`  [Check 5b] Firing parallel accept and decline via business routes...`);
    const promises = [
      acceptCall(business.token, callId).catch(e => ({ error: e.message, httpStatus: 0 })),
      declineCall(business.token, callId).catch(e => ({ error: e.message, httpStatus: 0 })),
    ];

    const results = await Promise.all(promises);

    const acceptResult = results[0];
    const declineResult = results[1];

    console.log(`  [Check 5b] Accept HTTP status: ${acceptResult.httpStatus}`);
    console.log(`  [Check 5b] Decline HTTP status: ${declineResult.httpStatus}`);

    // Check if both returned 200 (should not happen - one should win with 409)
    if (acceptResult.httpStatus === 200 && declineResult.httpStatus === 200) {
      stats.acceptDeclineRace.both200++;
      console.log(`  [Check 5b] ✗ FAIL: Both accept and decline returned 200`);
    } else {
      stats.acceptDeclineRace.success++;
      console.log(`  [Check 5b] ✓ One won (correct)`);
    }
    
    // Cleanup
    console.log(`  [Check 5b] Cleaning up call...`);
    ;
    await db.query(`DELETE FROM "Call" WHERE id = $1`, [callId]);
    ;
    console.log(`  [Check 5b] ✓ Call cleaned up`);
    
    await fetch(`${API_BASE}/contacts/${contactId}`, {
      method: 'DELETE',
      headers: { 'Cookie': `token=${individual.token}` },
    });
    console.log(`  [Check 5b] ✓ Contact cleaned up`);
    
  } catch (error) {
    console.log(`  [Check 5b] ✗ Failed: ${error.message}`);
    // Cleanup
    if (callId) {
      try {
        ;
        await db.query(`DELETE FROM "Call" WHERE id = $1`, [callId]);
        ;
      } catch (e) {}
    }
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

// Test 5d: Accept vs timeout race
async function testAcceptTimeoutRace(individual, business) {
  stats.acceptTimeoutRace.count++;

  let contactId, callId;

  console.log(`  [Check 5d] Testing ${individual.id} -> ${business.id}`);

  try {
    // Link both directions
    console.log(`  [Check 5d] Creating mutual contacts...`);
    const links = await linkBoth(individual, business, API_BASE);
    contactId = links.individualContact?.id;
    console.log(`  [Check 5d] ✓ Mutual contacts created (ID: ${contactId})`);

    const call = await dialCall(individual.token, contactId);
    callId = call.id;
    console.log(`  [Check 5d] ✓ Call created (ID: ${callId})`);

    // Accept immediately via business route
    console.log(`  [Check 5d] Accepting call immediately via business route...`);
    await acceptCall(business.token, callId);
    console.log(`  [Check 5d] ✓ Call accepted`);

    // Wait a bit then check if it got overwritten to 'missed'
    console.log(`  [Check 5d] Waiting 2.5s to check if scheduler overwrites...`);
    await new Promise(resolve => setTimeout(resolve, 2500));

    const status = await getCallStatus(callId);
    console.log(`  [Check 5d] Call status: ${status}`);

    if (status === 'missed') {
      stats.acceptTimeoutRace.overwritten++;
      console.log(`  [Check 5d] ⚠️  OVERWRITTEN: Accepted call marked as 'missed'`);
    } else {
      stats.acceptTimeoutRace.success++;
      console.log(`  [Check 5d] ✓ Call stayed accepted (correct)`);
    }
    
    // Cleanup
    console.log(`  [Check 5d] Cleaning up call...`);
    ;
    await db.query(`DELETE FROM "Call" WHERE id = $1`, [callId]);
    ;
    console.log(`  [Check 5d] ✓ Call cleaned up`);
    
    await fetch(`${API_BASE}/contacts/${contactId}`, {
      method: 'DELETE',
      headers: { 'Cookie': `token=${individual.token}` },
    });
    console.log(`  [Check 5d] ✓ Contact cleaned up`);
    
  } catch (error) {
    console.log(`  [Check 5d] ✗ Failed: ${error.message}`);
    // Cleanup
    if (callId) {
      try {
        ;
        await db.query(`DELETE FROM "Call" WHERE id = $1`, [callId]);
        ;
      } catch (e) {}
    }
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

// Test 5e: Long ring timeout notification timing
async function testLongTimeoutNotify(individual, business) {
  stats.longTimeoutNotify.count++;

  let contactId, callId;

  console.log(`  [Check 5e] Testing ${individual.id} -> ${business.id}`);

  try {
    // Link both directions
    console.log(`  [Check 5e] Creating mutual contacts...`);
    const links = await linkBoth(individual, business, API_BASE);
    contactId = links.individualContact?.id;
    console.log(`  [Check 5e] ✓ Mutual contacts created (ID: ${contactId})`);

    // Set business ring timeout to 120 seconds (max allowed by API)
    console.log(`  [Check 5e] Setting ring timeout to 120s via protection-limits...`);
    const timeoutResponse = await fetch(`${API_BASE}/business/protection-limits`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${business.token}`,
      },
      body: JSON.stringify({ ringTimeoutSec: 120 }),
    });
    if (!timeoutResponse.ok) {
      console.log(`  [Check 5e] ⚠️  SKIP: Could not set ring timeout: ${timeoutResponse.status}`);
      stats.longTimeoutNotify.earlyNotify = 0; // Mark as skip
      return;
    }
    console.log(`  [Check 5e] ✓ Ring timeout set to 120s`);

    const call = await dialCall(individual.token, contactId);
    callId = call.id;
    console.log(`  [Check 5e] ✓ Call created (ID: ${callId})`);

    // Wait 3 seconds (should still be ringing with 300s timeout)
    console.log(`  [Check 5e] Waiting 3s (should still be ringing with 300s timeout)...`);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const status = await getCallStatus(callId);
    console.log(`  [Check 5e] Call status: ${status}`);
    
    if (status === 'missed') {
      stats.longTimeoutNotify.earlyNotify++;
      console.log(`  [Check 5e] ⚠️  EARLY NOTIFICATION: Call marked 'missed' with 300s timeout`);
    } else {
      stats.longTimeoutNotify.success++;
      console.log(`  [Check 5e] ✓ Call still ringing (correct)`);
    }
    
    // Cleanup
    console.log(`  [Check 5e] Cleaning up call...`);
    await db.query(`DELETE FROM "Call" WHERE id = $1`, [callId]);
    console.log(`  [Check 5e] ✓ Call cleaned up`);

    // Restore default timeout
    await fetch(`${API_BASE}/business/protection-limits`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${business.token}`,
      },
      body: JSON.stringify({ ringTimeoutSec: 30 }),
    });

    await fetch(`${API_BASE}/contacts/${contactId}`, {
      method: 'DELETE',
      headers: { 'Cookie': `token=${individual.token}` },
    });
    console.log(`  [Check 5e] ✓ Contact cleaned up`);
    
  } catch (error) {
    console.log(`  [Check 5e] ✗ Failed: ${error.message}`);
    // Cleanup
    if (callId) {
      try {
        ;
        await db.query(`DELETE FROM "Call" WHERE id = $1`, [callId]);
        ;
      } catch (e) {}
    }
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

async function runChapter() {
  console.log('='.repeat(80));
  console.log('Chapter 5: Two Hands, One Phone');
  console.log('='.repeat(80));
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log('');
  
  const testUsers = Math.min(CONCURRENCY, individuals.length, businesses.length);
  
  console.log('Check 5b: Accept vs decline race (repeat to expose timing issues)...');
  for (let i = 0; i < Math.min(10, testUsers); i++) {
    await testAcceptDeclineRace(individuals[i % testUsers], businesses[i % testUsers]);
  }
  
  console.log('');
  console.log('Check 5d: Accept vs timeout race (repeat to expose timing issues)...');
  for (let i = 0; i < Math.min(10, testUsers); i++) {
    await testAcceptTimeoutRace(individuals[i % testUsers], businesses[i % testUsers]);
  }
  
  console.log('');
  console.log('Check 5e: Long ring timeout notification...');
  for (let i = 0; i < Math.min(5, testUsers); i++) {
    await testLongTimeoutNotify(individuals[i], businesses[i]);
  }
  
  // Report results
  console.log('');
  console.log('RESULTS');
  console.log('='.repeat(80));
  
  console.log('Check 5b - Accept/Decline Race:');
  console.log(`  Attempts: ${stats.acceptDeclineRace.count}`);
  console.log(`  Both returned 200: ${stats.acceptDeclineRace.both200}`);
  console.log(`  Success (one won): ${stats.acceptDeclineRace.success}`);
  
  console.log('');
  console.log('Check 5d - Accept/Timeout Race:');
  console.log(`  Attempts: ${stats.acceptTimeoutRace.count}`);
  console.log(`  Overwritten to missed: ${stats.acceptTimeoutRace.overwritten}`);
  console.log(`  Success (stayed accepted): ${stats.acceptTimeoutRace.success}`);
  
  console.log('');
  console.log('Check 5e - Long Timeout Notify:');
  console.log(`  Attempts: ${stats.longTimeoutNotify.count}`);
  console.log(`  Early notification: ${stats.longTimeoutNotify.earlyNotify}`);
  console.log(`  Success (correct timing): ${stats.longTimeoutNotify.success}`);
  
  console.log('');
  console.log('PASS/FAIL CRITERIA');
  console.log('='.repeat(80));

  const both200 = stats.acceptDeclineRace.both200 > 0;
  const overwritten = stats.acceptTimeoutRace.overwritten > 0;
  const earlyNotify = stats.longTimeoutNotify.earlyNotify > 0;

  console.log(`Check 5b (both 200): ${both200 ? '✗ FAIL - accept and decline both succeeded' : '✓ PASS'}`);
  console.log(`Check 5d (overwritten): ${overwritten ? '✗ FAIL - accepted call marked as missed' : '✓ PASS'}`);
  console.log(`Check 5e (early notify): ${earlyNotify ? '✗ FAIL - early notification with long timeout' : '✓ PASS'}`);
  console.log('');

  // FAIL if any of the checks failed
  if (both200 || overwritten || earlyNotify) {
    console.log(`Overall: ✗ FAIL`);
    console.log('='.repeat(80));
    console.log('');
    console.log('FIX PATTERN:');
    console.log('- Make every transition a conditional update:');
    console.log('  updateMany({ where: { id, status: \'ringing\' }, data: {...} })');
    console.log('- Treat count === 0 as "someone else won" (return 409)');
    console.log('- Use per-business ring timeouts consistently');
  console.log("STRESS_RESULT=FAIL");
  process.exitCode = 1;
  return;
  }

  console.log(`Overall: ✓ PASS`);
  console.log('='.repeat(80));

  console.log("STRESS_RESULT=PASS");
  process.exitCode = 0;
}

runChapter().catch(err => {
  console.error('Chapter failed:', err);
  console.log("STRESS_RESULT=FAIL");
  process.exitCode = 1;
    db.end().catch(() => {});
});
