/**
 * H0: Harness Self-Test
 *
 * Verifies the harness infrastructure works correctly
 * - Environment validation
 * - Server spawn/kill
 * - Fake Nebius server
 * - API client
 * - Assertions
 */

import { check } from '../lib/assert.mjs';

export default async function run(context) {
  const { env, api, server, fakeNebius } = context;

  await check('H0-env-validation', async () => {
    if (!env.testDatabaseUrl) throw new Error('TEST_DATABASE_URL is not set');
    if (!env.jwtSecret) throw new Error('JWT_SECRET is not set');
    if (!env.baseUrl) throw new Error('BASE_URL is not set');
    if (!env.testDatabaseUrl.includes('_test')) throw new Error('Database name does not end in _test');
    if (!env.baseUrl.includes('localhost')) throw new Error('BASE_URL does not use localhost');
    return true;
  });

  await check('H0-server-running', async () => {
    if (!server || !server.isRunning()) throw new Error('Server instance is not running');
    return true;
  });

  await check('H0-fake-nebius-running', async () => {
    if (!fakeNebius) throw new Error('Fake Nebius instance does not exist');
    fakeNebius.setMode('ok');
    fakeNebius.clearRequests();
    return true;
  });

  await check('H0-api-reachable', async () => {
    const response = await api.get('/health');
    if (response.status >= 500) throw new Error(`API returns ${response.status} status`);
    return true;
  });

  await check('H0-fake-nebius-request', async () => {
    fakeNebius.setMode('ok');
    fakeNebius.clearRequests();
    
    // Make a request through the fake Nebius
    const response = await fetch('http://localhost:9453/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'test-model',
        messages: [{ role: 'user', content: 'test' }],
      }),
    });
    
    if (!response.ok) throw new Error('Fake Nebius did not return OK');
    
    const requests = fakeNebius.getRequests();
    if (requests.length === 0) throw new Error('Fake Nebius received no request');
    
    return true;
  });

  await check('H0-fake-nebius-modes', async () => {
    const modes = ['429', '500', '401', 'fenced', 'truncated'];
    
    for (const mode of modes) {
      fakeNebius.setMode(mode);
      fakeNebius.clearRequests();
      
      const response = await fetch('http://localhost:9453/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'test-model',
          messages: [{ role: 'user', content: 'test' }],
        }),
      });
      
      const requests = fakeNebius.getRequests();
      if (requests.length === 0) throw new Error(`Mode ${mode} received no request`);
    }
    
    fakeNebius.setMode('ok');
    return true;
  });
}
