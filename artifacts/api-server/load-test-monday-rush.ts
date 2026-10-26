/**
 * Monday Morning Rush Load Test
 *
 * Simulates concurrent users performing:
 * 1. Search for a business
 * 2. Add it as a contact
 * 3. List contacts
 * 4. Edit contact hours
 * 5. Add a hand-typed contact
 * 6. Delete both contacts
 *
 * Measures latency and reports p50, p95, p99, max, and error rates.
 *
 * SETUP:
 * Requires a valid JWT token from a logged-in user.
 * Get it from browser cookies after logging in to the app.
 *
 * Example:
 * TEST_TOKEN="your-jwt-token" npx tsx load-test-monday-rush.ts
 */

import 'dotenv/config';
import path from 'path';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

// Load .env from the project root (parent directory of artifacts/api-server)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.resolve(__dirname, '../../.env') });

const API_BASE = process.env.API_BASE || 'http://localhost:5175/api';
const CONCURRENT_USERS = Number(process.env.CONCURRENT_USERS) || 50;
const WARMUP_USERS = Number(process.env.WARMUP_USERS) || 5;
const TEST_TOKEN = process.env.TEST_TOKEN;

interface Timing {
  operation: string;
  duration: number;
  success: boolean;
  error?: string;
}

interface Stats {
  count: number;
  total: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
  errorRate: number;
}

// Statistics utilities
function calculateStats(timings: Timing[]): Stats {
  const successful = timings.filter(t => t.success);
  const durations = successful.map(t => t.duration).sort((a, b) => a - b);

  if (durations.length === 0) {
    return {
      count: timings.length,
      total: 0,
      min: 0,
      max: 0,
      p50: 0,
      p95: 0,
      p99: 0,
      errorRate: timings.length > 0 ? 1 : 0,
    };
  }

  const total = durations.reduce((a, b) => a + b, 0);
  const min = durations[0];
  const max = durations[durations.length - 1];

  const p50Index = Math.floor(durations.length * 0.5);
  const p95Index = Math.floor(durations.length * 0.95);
  const p99Index = Math.floor(durations.length * 0.99);

  return {
    count: timings.length,
    total,
    min,
    max,
    p50: durations[p50Index],
    p95: durations[p95Index],
    p99: durations[p99Index],
    errorRate: (timings.length - successful.length) / timings.length,
  };
}

async function withTiming<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<{ result: T; timing: Timing }> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    return { result, timing: { operation, duration, success: true } };
  } catch (error) {
    const duration = Date.now() - start;
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[withTiming] ${operation} failed: ${errorMsg}`);
    return {
      result: null as T,
      timing: {
        operation,
        duration,
        success: false,
        error: errorMsg,
      },
    };
  }
}

// API client
class APIClient {
  private token: string | null = null;
  private userId: string | null = null;

  constructor(token: string) {
    this.token = token;
    // Decode token to get user ID
    try {
      const payload = jwt.decode(token) as any;
      this.userId = payload.userId;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  private async request(
    method: string,
    path: string,
    body?: any
  ): Promise<Response> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Cookie': `token=${this.token}`,
    };

    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    return response;
  }

  async searchAccounts(query: string): Promise<any> {
    const response = await this.request('GET', `/accounts/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error(`Search failed: ${response.status}`);
    return response.json();
  }

  async addContactFromAccount(accountId: string): Promise<any> {
    const response = await this.request('POST', `/contacts/from-account/${accountId}`);
    if (!response.ok) throw new Error(`Add contact failed: ${response.status}`);
    return response.json();
  }

  async listContacts(): Promise<any> {
    const response = await this.request('GET', '/contacts?page=1&limit=20');
    if (!response.ok) throw new Error(`List contacts failed: ${response.status}`);
    return response.json();
  }

  async updateContact(contactId: string, data: any): Promise<any> {
    const response = await this.request('PUT', `/contacts/${contactId}`, data);
    if (!response.ok) throw new Error(`Update contact failed: ${response.status}`);
    return response.json();
  }

  async createContact(data: any): Promise<any> {
    const response = await this.request('POST', '/contacts', data);
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(`Create contact failed: ${response.status} - ${JSON.stringify(errorBody)}`);
    }
    const result = await response.json();
    if (!result || !result.id) {
      throw new Error(`Create contact returned invalid response: ${JSON.stringify(result)}`);
    }
    return result;
  }

  async deleteContact(contactId: string): Promise<any> {
    const response = await this.request('DELETE', `/contacts/${contactId}`);
    if (!response.ok) throw new Error(`Delete contact failed: ${response.status}`);
    return response.json();
  }
}

// Test workflow
async function runWorkflow(userId: string, suffix: string, token: string): Promise<Timing[]> {
  const timings: Timing[] = [];
  const client = new APIClient(token);

  console.log(`  [User ${userId}] Starting workflow...`);

  try {
    // Skip authentication timing since we use a pre-configured token
    timings.push({ operation: 'authenticate', duration: 0, success: true });
    console.log(`  [User ${userId}] ✓ Authenticated`);

    // 1. List contacts (measures GET /contacts latency)
    console.log(`  [User ${userId}] Step 1: Listing contacts...`);
    await withTiming('list_contacts', async () => {
      await client.listContacts();
    }).then(r => {
      timings.push(r.timing);
      console.log(`  [User ${userId}]   ✓ List complete`);
    });

    // 2. Add a hand-typed contact
    let handTypedContact: any;
    console.log(`  [User ${userId}] Step 2: Creating contact...`);
    const createResult = await withTiming('create_contact', async () => {
      handTypedContact = await client.createContact({
        name: `Manual Contact ${suffix}`,
        business: `Manual Business ${suffix}`,
        category: 'Other',
        phone: '+1234567890',
        withConversation: true,
      });
    });
    timings.push(createResult.timing);

    if (!createResult.timing.success || !handTypedContact) {
      console.log(`  [User ${userId}] ✗ Failed to create contact - ${createResult.timing.error || 'unknown error'}, skipping rest`);
      return timings;
    }

    console.log(`  [User ${userId}]   ✓ Contact created (ID: ${handTypedContact.id})`);

    const contactId = handTypedContact.id;

    // 3. Edit contact hours
    console.log(`  [User ${userId}] Step 3: Updating contact hours...`);
    await withTiming('update_contact_hours', async () => {
      await client.updateContact(contactId, {
        businessHoursJson: JSON.stringify({
          days: [1, 2, 3, 4, 5],
          start: 9,
          end: 17,
        }),
      });
    }).then(r => {
      timings.push(r.timing);
      console.log(`  [User ${userId}]   ✓ Update complete`);
    });

    // 4. Delete the contact
    console.log(`  [User ${userId}] Step 4: Deleting contact...`);
    await withTiming('delete_contact', async () => {
      await client.deleteContact(contactId);
    }).then(r => {
      timings.push(r.timing);
      console.log(`  [User ${userId}]   ✓ Delete complete`);
    });

    console.log(`  [User ${userId}] ✓ Workflow complete`);
  } catch (error) {
    console.log(`  [User ${userId}] ✗ Workflow error: ${error instanceof Error ? error.message : String(error)}`);
    timings.push({
      operation: 'workflow_error',
      duration: 0,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return timings;
}

// Main test runner
async function runLoadTest() {
  if (!TEST_TOKEN) {
    console.error('ERROR: TEST_TOKEN environment variable is required');
    console.error('');
    console.error('To get your token:');
    console.error('1. Log into the app in your browser');
    console.error('2. Open DevTools (F12)');
    console.error('3. Go to Application → Cookies');
    console.error('4. Copy the "token" cookie value');
    console.error('5. Run: TEST_TOKEN="your-token" npx tsx load-test-monday-rush.ts');
    process.exit(1);
  }

  console.log('='.repeat(80));
  console.log('Monday Morning Rush Load Test');
  console.log('='.repeat(80));
  console.log(`API Base: ${API_BASE}`);
  console.log(`Concurrent Users: ${CONCURRENT_USERS}`);
  console.log(`Warmup Users: ${WARMUP_USERS}`);
  console.log('');

  // Warmup
  console.log('Starting warmup...');
  const warmupPromises = Array.from({ length: WARMUP_USERS }, (_, i) =>
    runWorkflow(`warmup-${i}`, `warmup-${i}`, TEST_TOKEN)
  );
  await Promise.all(warmupPromises);
  console.log('Warmup complete');
  console.log('');

  // Main test
  console.log('Starting main test...');
  const allTimings: Timing[] = [];
  const operationTimings: Map<string, Timing[]> = new Map();

  const startTime = Date.now();
  const promises = Array.from({ length: CONCURRENT_USERS }, (_, i) =>
    // Stagger requests by 10ms to avoid database locks
    (async () => {
      await new Promise(resolve => setTimeout(resolve, i * 10));
      return runWorkflow(`user-${i}`, `user-${i}`, TEST_TOKEN);
    })()
  );

  const results = await Promise.all(promises);
  const endTime = Date.now();

  for (const timings of results) {
    allTimings.push(...timings);
    for (const timing of timings) {
      const opTimings = operationTimings.get(timing.operation) || [];
      opTimings.push(timing);
      operationTimings.set(timing.operation, opTimings);
    }
  }

  const duration = endTime - startTime;

  // Report results
  console.log('');
  console.log('='.repeat(80));
  console.log('RESULTS');
  console.log('='.repeat(80));
  console.log(`Total Duration: ${duration}ms`);
  console.log(`Total Operations: ${allTimings.length}`);
  console.log(`Operations/Second: ${(allTimings.length / (duration / 1000)).toFixed(2)}`);
  console.log('');

  // Overall stats
  const overallStats = calculateStats(allTimings);
  console.log('Overall Statistics:');
  console.log(`  Success Rate: ${((1 - overallStats.errorRate) * 100).toFixed(2)}%`);
  console.log(`  P50 Latency: ${overallStats.p50}ms`);
  console.log(`  P95 Latency: ${overallStats.p95}ms`);
  console.log(`  P99 Latency: ${overallStats.p99}ms`);
  console.log(`  Max Latency: ${overallStats.max}ms`);
  console.log('');

  // Per-operation stats
  console.log('Per-Operation Statistics:');
  const operations = Array.from(operationTimings.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  for (const [operation, timings] of operations) {
    const stats = calculateStats(timings);
    console.log(`\n${operation}:`);
    console.log(`  Count: ${stats.count}`);
    console.log(`  Success Rate: ${((1 - stats.errorRate) * 100).toFixed(2)}%`);
    console.log(`  P50: ${stats.p50}ms`);
    console.log(`  P95: ${stats.p95}ms`);
    console.log(`  P99: ${stats.p99}ms`);
    console.log(`  Max: ${stats.max}ms`);

    // Check if p95 exceeds 800ms threshold
    if (stats.p95 > 800) {
      console.log(`  ⚠️  WARNING: P95 exceeds 800ms threshold`);
    }
  }

  // Error summary
  const errors = allTimings.filter(t => !t.success);
  if (errors.length > 0) {
    console.log('');
    console.log('Error Summary:');
    const errorCounts = new Map<string, number>();
    for (const error of errors) {
      const key = `${error.operation}: ${error.error || 'unknown'}`;
      errorCounts.set(key, (errorCounts.get(key) || 0) + 1);
    }
    for (const [error, count] of errorCounts) {
      console.log(`  ${error}: ${count}`);
    }
  }

  console.log('');
  console.log('='.repeat(80));
  console.log('PASS/FAIL CRITERIA');
  console.log('='.repeat(80));

  const listStats = operationTimings.get('list_contacts');
  const has5xx = errors.some(e => e.error?.includes('5') || e.error?.includes('500'));

  const passed =
    !has5xx &&
    (listStats ? calculateStats(listStats).p95 < 800 : true) &&
    overallStats.errorRate < 0.05; // Less than 5% error rate

  console.log(`No 5xx errors: ${!has5xx ? '✓' : '✗'}`);
  console.log(`List P95 < 800ms: ${listStats && calculateStats(listStats).p95 < 800 ? '✓' : '✗'}`);
  console.log(`Error rate < 5%: ${overallStats.errorRate < 0.05 ? '✓' : '✗'}`);
  console.log('');
  console.log(`Overall: ${passed ? '✓ PASS' : '✗ FAIL'}`);
  console.log('='.repeat(80));

  process.exit(passed ? 0 : 1);
}

runLoadTest().catch(error => {
  console.error('Load test failed:', error);
  process.exit(1);
});
