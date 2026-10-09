/**
 * Calls REST API (v11 - role-based)
 *
 * Factory that creates a calls router for a specific role (individual or business).
 *
 * Common routes (both roles):
 * GET  /api/calls                    — list all calls for the role
 * GET  /api/calls/:id                — poll call status
 * GET  /api/calls/:callId/messages   — get transcript for a call
 * POST /api/calls/dial               — initiate a call
 * POST /api/calls/:id/accept         — accept an incoming call
 * POST /api/calls/:id/decline        — decline an incoming call
 *
 * Individual-only routes:
 * GET  /api/conversations/:conversationId/calls — list calls for a conversation
 */

import { Router, type IRouter } from 'express';
import { prisma } from '@workspace/db-prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { getAccountRole } from '../lib/roles';
import {
  listCallsFor,
  getCallFor,
  listConversationCallsFor,
  getTranscriptFor,
  dialCallAs,
  acceptCallAs,
  declineCallAs,
  type CallRole,
} from '../services/callSignaling';
import { logger } from '../lib/logger';

export function createCallsRouter(role: CallRole): IRouter {
  const router: IRouter = Router();

  // ---------------------------------------------------------------------------
  // GET /api/calls — list all calls for the role
  // ---------------------------------------------------------------------------

  router.get('/', asyncHandler(async (req, res) => {
    const calls = await listCallsFor(req.userId!, role);
    res.json(calls);
  }, 'Failed to list calls'));

  // ---------------------------------------------------------------------------
  // GET /api/calls/:id — poll call status / details
  // ---------------------------------------------------------------------------

  router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const call = await getCallFor(String(id), req.userId!, role);
    if (!call) {
      res.status(404).json({ error: 'Call not found' });
      return;
    }
    res.json(call);
  }, 'Failed to get call'));

  // ---------------------------------------------------------------------------
  // GET /api/calls/:callId/messages — get transcript for a call
  // ---------------------------------------------------------------------------

  router.get('/:callId/messages', asyncHandler(async (req, res) => {
    const { callId } = req.params;
    const messages = await getTranscriptFor(String(callId), req.userId!, role);
    if (messages === null) {
      res.status(404).json({ error: 'Call not found' });
      return;
    }
    res.json(messages);
  }, 'Failed to get call transcript'));

  // ---------------------------------------------------------------------------
  // GET /api/conversations/:conversationId/calls — list calls for a conversation (individual-only)
  // ---------------------------------------------------------------------------

  if (role === 'individual') {
    router.get('/conversations/:conversationId/calls', asyncHandler(async (req, res) => {
      const { conversationId } = req.params;
      const calls = await listConversationCallsFor(String(conversationId), req.userId!);
      res.json(calls);
    }, 'Failed to list conversation calls'));
  }

  // ---------------------------------------------------------------------------
  // POST /api/calls/dial — initiate a call
  // ---------------------------------------------------------------------------

  router.post('/dial', asyncHandler(async (req, res) => {
    const { contactId, taskId } = req.body;

    if (!contactId) {
      res.status(400).json({ error: 'contactId is required' });
      return;
    }

    logger.info({ userId: req.userId, contactId, taskId, role }, 'dial: received call request');

    try {
      const result = await dialCallAs(String(contactId), taskId ? String(taskId) : null, req.userId!, role);

      if (result.status === 'missed') {
        res.status(202).json({ callId: result.call.id, status: 'missed' });
        return;
      }

      logger.info(
        { callId: result.call.id, status: result.status, delivered: result.delivered },
        'dial: call created successfully'
      );

      res.status(200).json({ callId: result.call.id, status: 'ringing' });
    } catch (e) {
      logger.error({ error: e }, 'dial: failed to create call');
      res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to dial call' });
    }
  }, 'Failed to dial call'));

  // ---------------------------------------------------------------------------
  // POST /api/calls/:id/accept — accept an incoming call
  // ---------------------------------------------------------------------------

  router.post('/:id/accept', asyncHandler(async (req, res) => {
    const { id } = req.params;

    logger.info({ callId: id, userId: req.userId, role }, 'calls: accept request received');

    try {
      const result = await acceptCallAs(String(id), req.userId!, role);
      logger.info({ callId: id, status: result.status }, 'Call accepted');
      res.json({ status: result.status });
    } catch (e) {
      logger.error({ error: e }, 'calls: failed to accept call');
      res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to accept call' });
    }
  }, 'Failed to accept call'));

  // ---------------------------------------------------------------------------
  // POST /api/calls/:id/decline — decline an incoming call
  // ---------------------------------------------------------------------------

  router.post('/:id/decline', asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
      const result = await declineCallAs(String(id), req.userId!, role);
      logger.info({ callId: id, status: result.status }, 'Call declined');
      res.json({ status: result.status });
    } catch (e) {
      logger.error({ error: e }, 'calls: failed to decline call');
      res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to decline call' });
    }
  }, 'Failed to decline call'));

  return router;
}

// Default export for individual role (used in routes/index.ts)
export default createCallsRouter('individual');
