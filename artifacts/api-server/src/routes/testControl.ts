/**
 * Test control routes
 *
 * These routes are only mounted in test mode and provide control over fake services
 * for testing purposes. They should never be accessible in production.
 */

import { Router } from 'express';
import { isTestMode } from '../lib/testMode';
import { getIntrospectionMetrics } from '../lib/introspection';

const router = Router();

// Verify test mode before mounting
if (!isTestMode()) {
  throw new Error('Test control routes can only be mounted in test mode');
}

// ---------------------------------------------------------------------------
// Fake Gemini Control Plane
// ---------------------------------------------------------------------------

// In-memory storage for fake Gemini sessions
const geminiSessions = new Map<string, {
  log: Array<{ type: string; data: any; timestamp: number }>;
  connectMode: 'ok' | 'fail' | 'slow' | 'rate-limit';
}>();

router.post('/gemini/:callId/say', (req, res) => {
  const { callId } = req.params;
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'text is required' });
  }

  let session = geminiSessions.get(callId);
  if (!session) {
    session = { log: [], connectMode: 'ok' };
    geminiSessions.set(callId, session);
  }

  session.log.push({
    type: 'input',
    data: { text },
    timestamp: Date.now(),
  });

  res.json({ ok: true });
});

router.post('/gemini/:callId/agent-say', (req, res) => {
  const { callId } = req.params;
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'text is required' });
  }

  let session = geminiSessions.get(callId);
  if (!session) {
    session = { log: [], connectMode: 'ok' };
    geminiSessions.set(callId, session);
  }

  session.log.push({
    type: 'output',
    data: { text },
    timestamp: Date.now(),
  });

  res.json({ ok: true });
});

router.post('/gemini/:callId/tool', (req, res) => {
  const { callId } = req.params;
  const { name, args, id } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'tool name is required' });
  }

  let session = geminiSessions.get(callId);
  if (!session) {
    session = { log: [], connectMode: 'ok' };
    geminiSessions.set(callId, session);
  }

  session.log.push({
    type: 'tool_call',
    data: { name, args, id },
    timestamp: Date.now(),
  });

  res.json({ ok: true });
});

router.post('/gemini/:callId/drop', (req, res) => {
  const { callId } = req.params;

  const session = geminiSessions.get(callId);
  if (session) {
    session.log.push({
      type: 'session_closed',
      data: {},
      timestamp: Date.now(),
    });
  }

  geminiSessions.delete(callId);
  res.json({ ok: true });
});

router.post('/gemini/connect-mode', (req, res) => {
  const { mode } = req.body;

  if (!['ok', 'fail', 'slow', 'rate-limit'].includes(mode)) {
    return res.status(400).json({ error: 'Invalid mode' });
  }

  // Store the mode for the next live.connect call
  // This would be used by the fake Gemini client in S2
  (global as any).__testGeminiConnectMode = mode;

  res.json({ ok: true, mode });
});

router.get('/gemini/:callId/log', (req, res) => {
  const { callId } = req.params;

  const session = geminiSessions.get(callId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json({
    callId,
    log: session.log,
    connectMode: session.connectMode,
  });
});

// ---------------------------------------------------------------------------
// Scheduler Control
// ---------------------------------------------------------------------------

let autoDialEnabled = true;

router.post('/scheduler/auto-dial', (req, res) => {
  const { enabled } = req.body;

  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ error: 'enabled must be boolean' });
  }

  autoDialEnabled = enabled;
  res.json({ ok: true, autoDialEnabled });
});

// ---------------------------------------------------------------------------
// State Introspection (S5)
// ---------------------------------------------------------------------------

router.get('/state', async (req, res) => {
  const metrics = await getIntrospectionMetrics();
  res.json(metrics);
});

// ---------------------------------------------------------------------------
// Memory Briefing
// ---------------------------------------------------------------------------

router.get('/briefing/:callId', (req, res) => {
  const { callId } = req.params;

  // Return rendered memory block for a call
  // This would need to be connected to actual memory service
  res.json({
    callId,
    briefing: 'Not yet implemented - requires memory service integration',
  });
});

export { router as testControlRouter };
