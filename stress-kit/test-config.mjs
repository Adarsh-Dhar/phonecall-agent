/**
 * Shared test configuration validator
 *
 * Validates environment variables and API reachability before running stress tests.
 * Import this from all chapter scripts, seed.mjs, and cleanup.mjs.
 */

export function validateTestConfig() {
  const errors = [];

  // Check TEST_DATABASE_URL
  const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
  if (!TEST_DATABASE_URL) {
    errors.push('TEST_DATABASE_URL must be set in .env (DATABASE_URL is not a fallback)');
  } else {
    try {
      const dbUrl = new URL(TEST_DATABASE_URL);

      // Validate database host is localhost
      const dbHost = dbUrl.hostname;
      if (dbHost !== 'localhost' && dbHost !== '127.0.0.1' && dbHost !== '::1') {
        errors.push(`TEST_DATABASE_URL must use localhost for safety (got: ${dbHost})`);
      }

      // Validate database name ends with _test
      const dbName = dbUrl.pathname.slice(1); // Remove leading /
      if (!dbName.endsWith('_test')) {
        errors.push(`Database name must end with '_test' for safety (got: ${dbName})`);
        errors.push('This prevents accidental use of production databases');
      }
    } catch (e) {
      errors.push(`Could not parse TEST_DATABASE_URL: ${e.message}`);
    }
  }

  // Check JWT_SECRET
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    errors.push('JWT_SECRET must be set in .env');
  }

  // Check API_BASE
  const API_BASE = process.env.API_BASE || 'http://localhost:5175/api';
  try {
    const apiUrl = new URL(API_BASE);
    const apiHost = apiUrl.hostname;
    if (apiHost !== 'localhost' && apiHost !== '127.0.0.1' && apiHost !== '::1') {
      errors.push(`API_BASE must use localhost for safety (got: ${apiHost})`);
    }
  } catch (e) {
    errors.push(`Could not parse API_BASE: ${e.message}`);
  }

  // Check WS_BASE if provided
  const WS_BASE = process.env.WS_BASE || 'ws://localhost:5175';
  try {
    const wsUrl = new URL(WS_BASE);
    const wsHost = wsUrl.hostname;
    if (wsHost !== 'localhost' && wsHost !== '127.0.0.1' && wsHost !== '::1') {
      errors.push(`WS_BASE must use localhost for safety (got: ${wsHost})`);
    }
  } catch (e) {
    errors.push(`Could not parse WS_BASE: ${e.message}`);
  }

  // Check for STRESS_FORCE bypass (not allowed for ordinary test runs)
  if (process.env.STRESS_FORCE) {
    errors.push('STRESS_FORCE bypass is not allowed for ordinary test runs');
  }

  if (errors.length > 0) {
    console.error('Configuration validation failed:');
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  console.log(`✓ Configuration validated`);
  console.log(`  Database: ${new URL(TEST_DATABASE_URL).pathname.slice(1)} on localhost`);
  console.log(`  API: ${API_BASE}`);
  console.log(`  WebSocket: ${WS_BASE}`);
}

export async function verifyApiReachable() {
  const API_BASE = process.env.API_BASE || 'http://localhost:5175/api';

  try {
    const response = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    }).catch(() => {
      // If /health doesn't exist, try a simple endpoint
      return fetch(`${API_BASE}/accounts/search?q=test`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
    });

    if (response.ok || response.status === 401) {
      console.log(`✓ API server is reachable at ${API_BASE}`);
      return;
    }

    console.error(`✗ API server returned unexpected status: ${response.status}`);
    process.exit(1);
  } catch (error) {
    console.error(`✗ API server is not reachable at ${API_BASE}: ${error.message}`);
    console.error('Ensure the API server is running before running stress tests');
    process.exit(1);
  }
}

export function getConfig() {
  return {
    API_BASE: process.env.API_BASE || 'http://localhost:5175/api',
    WS_BASE: process.env.WS_BASE || 'ws://localhost:5175',
    JWT_SECRET: process.env.JWT_SECRET,
    TEST_DATABASE_URL: process.env.TEST_DATABASE_URL,
    N_INDIVIDUALS: Number(process.env.N_INDIVIDUALS) || 20,
    CONCURRENCY: Number(process.env.CONCURRENCY) || 20,
    ITERATIONS: Number(process.env.ITERATIONS) || 200,
  };
}

export async function linkBoth(ind, biz, API_BASE) {
  const a = await fetch(`${API_BASE}/contacts/from-account/${biz.id}`, {
    method: 'POST',
    headers: { Cookie: `token=${ind.token}` }
  });
  const b = await fetch(`${API_BASE}/business/contacts/from-account/${ind.id}`, {
    method: 'POST',
    headers: { Cookie: `token=${biz.token}` }
  });
  if (![201, 409].includes(a.status) || ![201, 409].includes(b.status)) {
    throw new Error(`link failed ${a.status}/${b.status}`);
  }
  // If 409 (already exists), we need to fetch the existing contact
  let individualContact = null;
  if (a.status === 201) {
    individualContact = await a.json();
  } else {
    // Fetch existing contact
    const list = await fetch(`${API_BASE}/contacts`, {
      headers: { Cookie: `token=${ind.token}` }
    });
    if (list.ok) {
      const data = await list.json();
      const contacts = Array.isArray(data) ? data : (data.data || []);
      individualContact = contacts.find(c => c.linkedAccountId === biz.id);
    }
  }
  const businessContact = b.status === 201 ? await b.json() : null;
  return { individualContact, businessContact };
}
