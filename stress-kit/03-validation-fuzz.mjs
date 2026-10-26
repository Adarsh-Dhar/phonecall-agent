/**
 * Chapter 3: The Weird Customer
 * 
 * Tests input validation with malformed data:
 * - Null bytes in text fields
 * - Large payloads (200 KB notes)
 * - Wrong types (object instead of string)
 * - Right-to-left override in titles
 * - Bad timezones, start > end, invalid days
 * 
 * Rule: Bad input must become a 4xx, never a 5xx
 */

import 'dotenv/config';
import fs from 'fs';
import { validateTestConfig, getConfig, verifyApiReachable } from './test-config.mjs';

validateTestConfig();
await verifyApiReachable();

const config = getConfig();
const API_BASE = config.API_BASE;

// Load tokens
let tokens;
try {
  tokens = JSON.parse(fs.readFileSync('./tokens.json', 'utf8'));
} catch (err) {
  console.error('Run npm run seed first to generate test accounts');
  process.exit(1);
}

const individual = tokens.individuals[0];

const stats = {
  nullByte: { status: null, expected: 400 },
  largePayload: { status: null, expected: 413 },
  wrongType: { status: null, expected: 400 },
  rloOverride: { status: null, expected: 400 },
  badTimezone: { status: null, expected: 400 },
  startAfterEnd: { status: null, expected: 400 },
  invalidDays: { status: null, expected: 400 },
};

async function createContact(token, data) {
  const response = await fetch(`${API_BASE}/contacts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `token=${token}`,
    },
    body: JSON.stringify(data),
  });
  return { status: response.status, body: await response.text() };
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
  return { status: response.status, body: await response.text() };
}

// Test 3a: Null byte in name
async function testNullByte() {
  console.log(`  [Test 3a] Testing null byte in name...`);
  try {
    const result = await createContact(individual.token, {
      name: 'Test\u0000Contact',
      business: 'Test Business',
      category: 'Other',
      phone: '+1234567890',
    });
    stats.nullByte.status = result.status;
    console.log(`  [Test 3a] Response status: ${result.status} (expected 4xx)`);
    if (result.status >= 500) {
      console.log(`  [Test 3a] ✗ FAIL: Got 5xx error instead of 4xx`);
      console.log(`  [Test 3a] Body: ${result.body.substring(0, 200)}`);
    } else {
      console.log(`  [Test 3a] ✓ Correctly rejected with 4xx`);
    }
  } catch (error) {
    stats.nullByte.status = 0;
    console.log(`  [Test 3a] Connection error: ${error.message}`);
  }
}

// Test 3b: Large payload (200 KB note)
async function testLargePayload() {
  console.log(`  [Test 3b] Testing large payload (200 KB)...`);
  try {
    const largeNote = 'x'.repeat(200 * 1024); // 200 KB
    const result = await createContact(individual.token, {
      name: 'Test Contact',
      business: 'Test Business',
      category: 'Other',
      phone: '+1234567890',
      note: largeNote,
    });
    stats.largePayload.status = result.status;
    console.log(`  [Test 3b] Response status: ${result.status} (expected 413)`);
    if (result.status >= 500) {
      console.log(`  [Test 3b] ✗ FAIL: Got 5xx error instead of 413`);
    } else {
      console.log(`  [Test 3b] ✓ Correctly rejected`);
    }
  } catch (error) {
    stats.largePayload.status = 0;
    console.log(`  [Test 3b] Connection error: ${error.message}`);
  }
}

// Test 3c: Wrong type (object instead of string)
async function testWrongType() {
  console.log(`  [Test 3c] Testing wrong type (object for name)...`);
  try {
    const result = await createContact(individual.token, {
      name: { nested: 'object' },
      business: 'Test Business',
      category: 'Other',
      phone: '+1234567890',
    });
    stats.wrongType.status = result.status;
    console.log(`  [Test 3c] Response status: ${result.status} (expected 400)`);
    if (result.status >= 500) {
      console.log(`  [Test 3c] ✗ FAIL: Got 5xx error instead of 400`);
      console.log(`  [Test 3c] Body: ${result.body.substring(0, 200)}`);
    } else {
      console.log(`  [Test 3c] ✓ Correctly rejected`);
    }
  } catch (error) {
    stats.wrongType.status = 0;
    console.log(`  [Test 3c] Connection error: ${error.message}`);
  }
}

// Test 3d: Right-to-left override in business name
async function testRLOOverride() {
  console.log(`  [Test 3d] Testing RLO override in business name...`);
  try {
    const result = await createContact(individual.token, {
      name: 'Test Contact',
      business: 'Test\u202EBusiness', // RLO override
      category: 'Other',
      phone: '+1234567890',
    });
    stats.rloOverride.status = result.status;
    console.log(`  [Test 3d] Response status: ${result.status} (expected 400)`);
    if (result.status >= 500) {
      console.log(`  [Test 3d] ✗ FAIL: Got 5xx error instead of 400`);
    } else {
      console.log(`  [Test 3d] ✓ Correctly rejected`);
    }
  } catch (error) {
    stats.rloOverride.status = 0;
    console.log(`  [Test 3d] Connection error: ${error.message}`);
  }
}

// Test 3e: Bad timezone
async function testBadTimezone() {
  let contactId;
  console.log(`  [Test 3e] Testing bad timezone...`);
  try {
    // First create a valid contact
    const contact = await createContact(individual.token, {
      name: 'Test Contact for Timezone',
      business: 'Test Business',
      category: 'Other',
      phone: '+1234567890',
    });
    contactId = contact.body ? JSON.parse(contact.body).id : null;
    
    if (contactId) {
      console.log(`  [Test 3e] Contact created (ID: ${contactId})`);
      const result = await updateContact(individual.token, contactId, {
        businessHoursJson: JSON.stringify({
          days: [1, 2, 3, 4, 5],
          start: 9,
          end: 17,
          tz: 'Invalid/Timezone',
        }),
      });
      stats.badTimezone.status = result.status;
      console.log(`  [Test 3e] Response status: ${result.status} (expected 400)`);
      if (result.status >= 500) {
        console.log(`  [Test 3e] ✗ FAIL: Got 5xx error instead of 400`);
      } else {
        console.log(`  [Test 3e] ✓ Correctly rejected`);
      }
      
      // Cleanup
      await fetch(`${API_BASE}/contacts/${contactId}`, {
        method: 'DELETE',
        headers: { 'Cookie': `token=${individual.token}` },
      });
      console.log(`  [Test 3e] ✓ Cleanup complete`);
    }
  } catch (error) {
    stats.badTimezone.status = 0;
    console.log(`  [Test 3e] Connection error: ${error.message}`);
  }
}

// Test 3f: Start > end
async function testStartAfterEnd() {
  let contactId;
  console.log(`  [Test 3f] Testing start > end...`);
  try {
    const contact = await createContact(individual.token, {
      name: 'Test Contact for Hours',
      business: 'Test Business',
      category: 'Other',
      phone: '+1234567890',
    });
    contactId = contact.body ? JSON.parse(contact.body).id : null;
    
    if (contactId) {
      console.log(`  [Test 3f] Contact created (ID: ${contactId})`);
      const result = await updateContact(individual.token, contactId, {
        businessHoursJson: JSON.stringify({
          days: [1, 2, 3, 4, 5],
          start: 17,
          end: 9,
        }),
      });
      stats.startAfterEnd.status = result.status;
      console.log(`  [Test 3f] Response status: ${result.status} (expected 400)`);
      if (result.status >= 500) {
        console.log(`  [Test 3f] ✗ FAIL: Got 5xx error instead of 400`);
      } else {
        console.log(`  [Test 3f] ✓ Correctly rejected`);
      }
      
      // Cleanup
      await fetch(`${API_BASE}/contacts/${contactId}`, {
        method: 'DELETE',
        headers: { 'Cookie': `token=${individual.token}` },
      });
      console.log(`  [Test 3f] ✓ Cleanup complete`);
    }
  } catch (error) {
    stats.startAfterEnd.status = 0;
    console.log(`  [Test 3f] Connection error: ${error.message}`);
  }
}

// Test 3g: Invalid days
async function testInvalidDays() {
  let contactId;
  console.log(`  [Test 3g] Testing invalid days...`);
  try {
    const contact = await createContact(individual.token, {
      name: 'Test Contact for Days',
      business: 'Test Business',
      category: 'Other',
      phone: '+1234567890',
    });
    contactId = contact.body ? JSON.parse(contact.body).id : null;
    
    if (contactId) {
      console.log(`  [Test 3g] Contact created (ID: ${contactId})`);
      const result = await updateContact(individual.token, contactId, {
        businessHoursJson: JSON.stringify({
          days: [9], // Invalid day (should be 0-6)
          start: 9,
          end: 17,
        }),
      });
      stats.invalidDays.status = result.status;
      console.log(`  [Test 3g] Response status: ${result.status} (expected 400)`);
      if (result.status >= 500) {
        console.log(`  [Test 3g] ✗ FAIL: Got 5xx error instead of 400`);
      } else {
        console.log(`  [Test 3g] ✓ Correctly rejected`);
      }
      
      // Cleanup
      await fetch(`${API_BASE}/contacts/${contactId}`, {
        method: 'DELETE',
        headers: { 'Cookie': `token=${individual.token}` },
      });
      console.log(`  [Test 3g] ✓ Cleanup complete`);
    }
  } catch (error) {
    stats.invalidDays.status = 0;
    console.log(`  [Test 3g] Connection error: ${error.message}`);
  }
}

async function runChapter() {
  console.log('='.repeat(80));
  console.log('Chapter 3: The Weird Customer');
  console.log('='.repeat(80));
  console.log('');
  console.log('Testing input validation with malformed data...');
  console.log('');
  
  await testNullByte();
  await testLargePayload();
  await testWrongType();
  await testRLOOverride();
  await testBadTimezone();
  await testStartAfterEnd();
  await testInvalidDays();
  
  // Report results
  console.log('');
  console.log('RESULTS');
  console.log('='.repeat(80));

  let failCount = 0;

  for (const [test, data] of Object.entries(stats)) {
    const is4xx = data.status >= 400 && data.status < 500;
    const is5xx = data.status >= 500;
    const is2xx = data.status >= 200 && data.status < 300;
    const isConnError = data.status === 0;

    console.log(`${test}:`);
    console.log(`  Status: ${data.status}`);
    console.log(`  Expected: 4xx`);
    console.log(`  Result: ${is4xx ? '✓ PASS' : is5xx ? '✗ FAIL (5xx)' : is2xx ? '✗ FAIL (2xx - invalid input accepted)' : isConnError ? '✗ FAIL (connection error)' : '? UNKNOWN'}`);

    // FAIL if not 4xx (including 2xx, 5xx, connection errors, etc.)
    if (!is4xx) failCount++;
  }

  console.log('');
  console.log('PASS/FAIL CRITERIA');
  console.log('='.repeat(80));
  console.log(`All bad inputs return 4xx (not 2xx, 5xx, or connection errors): ${failCount === 0 ? '✓ PASS' : '✗ FAIL'}`);
  console.log('');

  console.log(`Overall: ${failCount === 0 ? '✓ PASS' : '✗ FAIL'}`);
  console.log('='.repeat(80));

  console.log(`STRESS_RESULT=${failCount === 0 ? 'PASS' : 'FAIL'}`);
  process.exitCode = failCount === 0 ? 0 : 1;

  console.log('');
  console.log('FIX PATTERN:');
  console.log('- Add shared schema validator (zod) with max lengths');
  console.log('- Enforce string-only fields');
  console.log('- Strip null bytes from input');
  console.log('- Validate business hours (timezone, day range, start <= end)');
}

runChapter().catch(err => {
  console.error('Chapter failed:', err);
  process.exit(1);
});
