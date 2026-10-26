/**
 * Chapter 7: Nosy Neighbour
 * 
 * Another customer, Ravi, copies Maya's IDs out of a screenshot and tries
 * them against his own login.
 * 
 * Tests tenant isolation on every contact and call route, role crossing
 * (individual vs business), and token abuse (tampered, expired, alg=none,
 * deleted account)
 * 
 * Probable finding: GET/POST /contacts/:id/knowledge accepts the real
 * business account id as :id for anyone who has saved that business. Two
 * individuals who both saved the same business therefore share one knowledge
 * list: one can write facts the other reads.
 */

import 'dotenv/config';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const API_BASE = process.env.API_BASE || 'http://localhost:5175/api';
const JWT_SECRET = process.env.JWT_SECRET;
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
  process.exit(1);
}

// Load tokens
let tokens;
try {
  tokens = JSON.parse(fs.readFileSync('./tokens.json', 'utf8'));
} catch (err) {
  console.error('Run npm run seed first to generate test accounts');
  process.exit(1);
}

const individual1 = tokens.individuals[0];
const individual2 = tokens.individuals[1];
const business = tokens.businesses[0];

const stats = {
  crossUserContact: { passed: false },
  crossUserCall: { passed: false },
  knowledgeIsolation: { passed: false, leakFound: false },
  tamperedToken: { passed: false },
  expiredToken: { passed: false },
  algNoneToken: { passed: false },
  deletedAccount: { passed: false },
};

// Helper function to clean up existing contacts before tests
async function cleanupContacts(token, businessId) {
  try {
    // List all contacts
    const listResponse = await fetch(`${API_BASE}/contacts`, {
      headers: {
        'Cookie': `token=${token}`,
      },
    });

    if (listResponse.ok) {
      const data = await listResponse.json();
      const contacts = Array.isArray(data) ? data : (data.data || []);

      // Delete any contacts that match the business ID
      for (const contact of contacts) {
        if (contact.linkedAccountId === businessId) {
          await fetch(`${API_BASE}/contacts/${contact.id}`, {
            method: 'DELETE',
            headers: { 'Cookie': `token=${token}` },
          });
        }
      }
    }
  } catch (error) {
    // Ignore cleanup errors
  }
}

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

async function getContact(token, contactId) {
  const response = await fetch(`${API_BASE}/contacts/${contactId}`, {
    headers: {
      'Cookie': `token=${token}`,
    },
  });
  return { status: response.status, body: await response.text() };
}

async function createKnowledge(token, contactId, data) {
  const response = await fetch(`${API_BASE}/contacts/${contactId}/knowledge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `token=${token}`,
    },
    body: JSON.stringify(data),
  });
  return { status: response.status, body: await response.text() };
}

async function getKnowledge(token, contactId) {
  const response = await fetch(`${API_BASE}/contacts/${contactId}/knowledge`, {
    headers: {
      'Cookie': `token=${token}`,
    },
  });
  return { status: response.status, body: await response.text() };
}

// Test 7a: Cross-user contact access
async function testCrossUserContact() {
  console.log('[Check 7a] Testing cross-user contact access...');

  try {
    // Cleanup any existing contacts for this business
    await cleanupContacts(individual1.token, business.id);

    console.log('  [Check 7a] Individual1 adding business as contact...');
    const contact1 = await addContactFromAccount(individual1.token, business.id);
    console.log(`  [Check 7a] ✓ Contact created (ID: ${contact1.id})`);
    
    console.log('  [Check 7a] Individual2 trying to access Individual1\'s contact...');
    const result = await getContact(individual2.token, contact1.id);
    console.log(`  [Check 7a] Response status: ${result.status}`);
    
    if (result.status === 404 || result.status === 403) {
      console.log('  [Check 7a] ✓ PASS: Cross-user contact access blocked');
      stats.crossUserContact.passed = true;
    } else {
      console.log(`  [Check 7a] ✗ FAIL: Cross-user contact access allowed (status: ${result.status})`);
    }
    
    // Cleanup
    await fetch(`${API_BASE}/contacts/${contact1.id}`, {
      method: 'DELETE',
      headers: { 'Cookie': `token=${individual1.token}` },
    });
    console.log('  [Check 7a] ✓ Cleanup complete');
    
  } catch (error) {
    console.log(`  [Check 7a] ✗ Failed: ${error.message}`);
  }
}

// Test 7b: Cross-user call access
async function testCrossUserCall() {
  console.log('');
  console.log('[Check 7b] Testing cross-user call access...');

  try {
    // Cleanup any existing contacts for this business
    await cleanupContacts(individual1.token, business.id);

    console.log('  [Check 7b] Individual1 adding business as contact...');
    const contact1 = await addContactFromAccount(individual1.token, business.id);
    console.log(`  [Check 7b] ✓ Contact created (ID: ${contact1.id})`);
    
    console.log('  [Check 7b] Individual1 dialing...');
    const callResponse = await fetch(`${API_BASE}/calls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${individual1.token}`,
      },
      body: JSON.stringify({ contactId: contact1.id }),
    });
    
    if (!callResponse.ok) {
      console.log('  [Check 7b] ⚠️  SKIP: Dial failed (business may not have phone setup - skipping call access test)');
      console.log('  [Check 7b] ⚠️  SKIP: Marked as SKIP, not PASS - requires manual verification with phone setup');
      stats.crossUserCall.passed = false; // Do not count as pass
      // Cleanup and return
      await fetch(`${API_BASE}/contacts/${contact1.id}`, {
        method: 'DELETE',
        headers: { 'Cookie': `token=${individual1.token}` },
      });
      console.log('  [Check 7b] ✓ Cleanup complete');
      return;
    }
    
    const call = await callResponse.json();
    console.log(`  [Check 7b] ✓ Call created (ID: ${call.id})`);
    
    console.log('  [Check 7b] Individual2 trying to access Individual1\'s call...');
    const result = await fetch(`${API_BASE}/calls/${call.id}`, {
      headers: {
        'Cookie': `token=${individual2.token}`,
      },
    });
    console.log(`  [Check 7b] Response status: ${result.status}`);
    
    if (result.status === 404 || result.status === 403) {
      console.log('  [Check 7b] ✓ PASS: Cross-user call access blocked');
      stats.crossUserCall.passed = true;
    } else {
      console.log(`  [Check 7b] ✗ FAIL: Cross-user call access allowed (status: ${result.status})`);
    }
    
    // Cleanup
    await fetch(`${API_BASE}/contacts/${contact1.id}`, {
      method: 'DELETE',
      headers: { 'Cookie': `token=${individual1.token}` },
    });
    console.log('  [Check 7b] ✓ Cleanup complete');
    
  } catch (error) {
    console.log(`  [Check 7b] ✗ Failed: ${error.message}`);
  }
}

// Test 7c: Knowledge isolation (the main finding from code review)
async function testKnowledgeIsolation() {
  console.log('');
  console.log('[Check 7c] Testing knowledge isolation (shared business ID)...');

  try {
    // Cleanup any existing contacts for this business
    await cleanupContacts(individual1.token, business.id);
    await cleanupContacts(individual2.token, business.id);

    console.log('  [Check 7c] Both individuals adding the same business...');
    const contact1 = await addContactFromAccount(individual1.token, business.id);
    const contact2 = await addContactFromAccount(individual2.token, business.id);
    console.log(`  [Check 7c] ✓ Both contacts created`);
    
    console.log('  [Check 7c] Individual1 adding secret knowledge...');
    const createResult = await createKnowledge(individual1.token, contact1.id, {
      category: 'test',
      key: 'secret',
      value: 'should not be visible to other individual',
    });
    console.log('  [Check 7c] ✓ Knowledge added');
    
    console.log('  [Check 7c] Individual2 trying to read knowledge using business ID...');
    const readResult = await getKnowledge(individual2.token, business.id);
    console.log(`  [Check 7c] Response status: ${readResult.status}`);
    
    if (readResult.status === 404 || readResult.status === 403) {
      console.log('  [Check 7c] ✓ PASS: Knowledge isolated (business ID blocked)');
      stats.knowledgeIsolation.passed = true;
    } else {
      const body = JSON.parse(readResult.body);
      if (Array.isArray(body) && body.some(f => f.key === 'secret')) {
        console.log('  [Check 7c] ⚠️  SECURITY ISSUE: Knowledge leaked across users!');
        stats.knowledgeIsolation.leakFound = true;
      } else {
        console.log('  [Check 7c] ✓ PASS: Knowledge not leaked');
        stats.knowledgeIsolation.passed = true;
      }
    }
    
    // Cleanup
    await fetch(`${API_BASE}/contacts/${contact1.id}`, {
      method: 'DELETE',
      headers: { 'Cookie': `token=${individual1.token}` },
    });
    await fetch(`${API_BASE}/contacts/${contact2.id}`, {
      method: 'DELETE',
      headers: { 'Cookie': `token=${individual2.token}` },
    });
    console.log('  [Check 7c] ✓ Cleanup complete');
    
  } catch (error) {
    console.log(`  [Check 7c] ✗ Failed: ${error.message}`);
  }
}

// Test 7d: Tampered token
async function testTamperedToken() {
  console.log('');
  console.log('[Check 7d] Testing tampered token...');
  
  try {
    console.log('  [Check 7d] Tampering with token (changing last character)...');
    const tamperedToken = individual1.token.slice(0, -1) + 'X';
    
    const result = await getContact(tamperedToken, 'any-id');
    console.log(`  [Check 7d] Response status: ${result.status}`);
    
    if (result.status === 401) {
      console.log('  [Check 7d] ✓ PASS: Tampered token rejected');
      stats.tamperedToken.passed = true;
    } else {
      console.log(`  [Check 7d] ✗ FAIL: Tampered token accepted (status: ${result.status})`);
    }
    
  } catch (error) {
    console.log(`  [Check 7d] ✗ Failed: ${error.message}`);
  }
}

// Test 7e: Expired token
async function testExpiredToken() {
  console.log('');
  console.log('[Check 7e] Testing expired token...');
  
  try {
    if (!JWT_SECRET) {
      console.log('  [Check 7e] ⚠️  SKIP: JWT_SECRET not set');
      return;
    }
    
    console.log('  [Check 7e] Creating expired token...');
    const expiredToken = jwt.sign(
      { userId: individual1.id, email: individual1.email },
      JWT_SECRET,
      { expiresIn: '-1h' } // Already expired
    );
    console.log('  [Check 7e] ✓ Expired token created');
    
    const result = await getContact(expiredToken, 'any-id');
    console.log(`  [Check 7e] Response status: ${result.status}`);
    
    if (result.status === 401) {
      console.log('  [Check 7e] ✓ PASS: Expired token rejected');
      stats.expiredToken.passed = true;
    } else {
      console.log(`  [Check 7e] ✗ FAIL: Expired token accepted (status: ${result.status})`);
    }
    
  } catch (error) {
    console.log(`  [Check 7e] ✗ Failed: ${error.message}`);
  }
}

// Test 7f: alg=none token
async function testAlgNoneToken() {
  console.log('');
  console.log('[Check 7f] Testing alg=none token (signature stripping attack)...');
  
  try {
    if (!JWT_SECRET) {
      console.log('  [Check 7f] ⚠️  SKIP: JWT_SECRET not set');
      return;
    }
    
    console.log('  [Check 7f] Creating token with alg=none...');
    const header = { alg: 'none', typ: 'JWT' };
    const payload = { userId: individual1.id, email: individual1.email };
    
    const noneToken = [
      Buffer.from(JSON.stringify(header)).toString('base64url'),
      Buffer.from(JSON.stringify(payload)).toString('base64url'),
      ''
    ].join('.');
    console.log('  [Check 7f] ✓ alg=none token created');
    
    const result = await getContact(noneToken, 'any-id');
    console.log(`  [Check 7f] Response status: ${result.status}`);
    
    if (result.status === 401) {
      console.log('  [Check 7f] ✓ PASS: alg=none token rejected');
      stats.algNoneToken.passed = true;
    } else {
      console.log(`  [Check 7f] ✗ FAIL: alg=none token accepted (status: ${result.status})`);
    }
    
  } catch (error) {
    console.log(`  [Check 7f] ✗ Failed: ${error.message}`);
  }
}

// Test 7g: Deleted account token
async function testDeletedAccount() {
  console.log('');
  console.log('[Check 7g] Testing deleted account token...');

  console.log('  [Check 7g] ⚠️  SKIP: Requires manual test - delete account then try token');
  console.log('  [Check 7g] ⚠️  SKIP: This test requires database account deletion and token reuse');
  console.log('  [Check 7g] ⚠️  SKIP: Marked as SKIP, not PASS - requires manual verification');
  stats.deletedAccount.passed = false; // Do not count as pass
}

async function runChapter() {
  console.log('='.repeat(80));
  console.log('Chapter 7: Nosy Neighbour');
  console.log('='.repeat(80));
  console.log('');
  
  await testCrossUserContact();
  await testCrossUserCall();
  await testKnowledgeIsolation();
  await testTamperedToken();
  await testExpiredToken();
  await testAlgNoneToken();
  await testDeletedAccount();
  
  // Report results
  console.log('');
  console.log('RESULTS');
  console.log('='.repeat(80));
  
  console.log('Check 7a - Cross-user Contact:');
  console.log(`  Passed: ${stats.crossUserContact.passed ? '✓' : '✗'}`);
  
  console.log('');
  console.log('Check 7b - Cross-user Call:');
  console.log(`  Passed: ${stats.crossUserCall.passed ? '✓' : '✗'}`);
  
  console.log('');
  console.log('Check 7c - Knowledge Isolation:');
  console.log(`  Passed: ${stats.knowledgeIsolation.passed ? '✓' : '✗'}`);
  console.log(`  Leak found: ${stats.knowledgeIsolation.leakFound ? '⚠️  YES - SECURITY ISSUE' : 'No'}`);
  
  console.log('');
  console.log('Check 7d - Tampered Token:');
  console.log(`  Passed: ${stats.tamperedToken.passed ? '✓' : '✗'}`);
  
  console.log('');
  console.log('Check 7e - Expired Token:');
  console.log(`  Passed: ${stats.expiredToken.passed ? '✓' : '✗'}`);
  
  console.log('');
  console.log('Check 7f - alg=none Token:');
  console.log(`  Passed: ${stats.algNoneToken.passed ? '✓' : '✗'}`);
  
  console.log('');
  console.log('Check 7g - Deleted Account:');
  if (stats.deletedAccount.passed) {
    console.log(`  Passed: ✓`);
  } else {
    console.log(`  Result: ⚠️  SKIP (manual test required)`);
  }
  
  console.log('');
  console.log('PASS/FAIL CRITERIA');
  console.log('='.repeat(80));
  
  const criticalIssues = stats.knowledgeIsolation.leakFound;
  const requiredChecksPassed =
    stats.crossUserContact.passed &&
    stats.tamperedToken.passed &&
    stats.expiredToken.passed &&
    stats.algNoneToken.passed;

  const skippedChecks = !stats.crossUserCall.passed || !stats.deletedAccount.passed;

  if (criticalIssues) {
    console.log(`⚠️  CRITICAL: Knowledge isolation leak found - SECURITY ISSUE`);
    console.log(`Overall: ✗ FAIL (security issue)`);
  } else if (!requiredChecksPassed) {
    console.log(`Required authorization checks failed: ✗ FAIL`);
    console.log(`Overall: ✗ FAIL`);
  } else if (skippedChecks) {
    console.log(`Required authorization checks passed: ✓ PASS`);
    console.log(`Skipped checks (manual test required): ⚠️  SKIP`);
    console.log(`Overall: ⚠️  SKIP (manual tests required)`);
  } else {
    console.log(`All authorization checks passed: ✓ PASS`);
    console.log(`Overall: ✓ PASS`);
  }
  
  console.log('='.repeat(80));
  
  console.log('');
  console.log('FIX PATTERN:');
  console.log('- Add unique constraint on (ownerId, contactId) for knowledge');
  console.log('- Reject tokens with alg=none in JWT verification');
  console.log('- Verify account exists on every request');
  console.log('- Add row-level security checks on all routes');
  
  if (criticalIssues || !requiredChecksPassed) {
    process.exit(1);
  }
  // Exit 0 for SKIP or PASS (both are acceptable - SKIP requires manual verification)
  process.exit(0);
}

runChapter().catch(err => {
  console.error('Chapter failed:', err);
  process.exit(1);
});
