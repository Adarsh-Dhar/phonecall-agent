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
import { syncTaskToCalendar } from '../services/googleCalendar';
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
  NotInContactsError,
} from '../services/callSignaling';
import { logger } from '../lib/logger';
import { getDialAdvisory } from '../services/dialAdvisory';

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
      // Individuals dialing by hand: reject if the business blocks calls during a closure,
      // otherwise carry a warning (closed / outside hours) back with the response.
      const advisory = role === 'individual' ? await getDialAdvisory(String(contactId), req.userId!) : {};
      if (advisory.blocked) {
        // Create a task to call back at the next available time
        if (advisory.blocked.reopensAt) {
          try {
            const contact = await prisma.account.findUnique({
              where: { id: String(contactId) },
              select: { id: true, name: true },
            });
            if (contact) {
              // Find or create a conversation for this contact
              let conversation = await prisma.conversation.findFirst({
                where: { contactId: contact.id },
              });
              if (!conversation) {
                conversation = await prisma.conversation.create({
                  data: {
                    contactId: contact.id,
                    title: `Chat with ${contact.name}`,
                  },
                });
              }

              const nextAttemptAt = new Date(advisory.blocked.reopensAt);
              
              // Check if a task already exists for this contact at the same time
              const existingTask = await prisma.task.findFirst({
                where: {
                  contactId: contact.id,
                  dueDate: nextAttemptAt,
                  status: { in: ['open', 'suggested'] },
                },
              });

              if (!existingTask) {
                const task = await prisma.task.create({
                  data: {
                    title: `Call ${contact.name}`,
                    description: 'Call rescheduled due to business hours',
                    status: 'open',
                    kind: 'call',
                    contactId: contact.id,
                    conversationId: conversation.id,
                    dueDate: nextAttemptAt,
                    nextAttemptAt: nextAttemptAt,
                    schedulerStatus: 'pending',
                    callAttempts: 0,
                  },
                  include: { contact: true },
                });
                logger.info({ contactId: contact.id, nextAttemptAt }, 'Created callback task for blocked call');

                // Sync to Google Calendar (non-blocking)
                syncTaskToCalendar({
                  id: task.id,
                  title: task.title,
                  description: task.description,
                  dueDate: task.dueDate,
                  status: task.status,
                  googleEventId: task.googleEventId,
                  kind: task.kind,
                  meta: task.meta as any,
                  contact: { name: task.contact.name || '', business: task.contact.business || '' },
                  userId: req.userId!,
                }).catch((err) => {
                  logger.error({ err, taskId: task.id }, 'Failed to sync task to calendar');
                });
              } else {
                logger.info({ contactId: contact.id, nextAttemptAt, existingTaskId: existingTask.id }, 'Task already exists for this time, skipping creation');
              }
            }
          } catch (taskError) {
            logger.error({ error: taskError }, 'Failed to create callback task for blocked call');
          }
        }

        res.status(409).json({
          error: advisory.blocked.message,
          code: 'BUSINESS_CLOSED',
          reopensAt: advisory.blocked.reopensAt,
          kind: advisory.blocked.kind,
          label: advisory.blocked.label,
        });
        return;
      }

      const result = await dialCallAs(String(contactId), taskId ? String(taskId) : null, req.userId!, role);

      if (result.status === 'missed') {
        res.status(202).json({ callId: result.call.id, status: 'missed' });
        return;
      }

      logger.info(
        { callId: result.call.id, status: result.status, delivered: result.delivered },
        'dial: call created successfully'
      );

      const response: Record<string, unknown> = { callId: result.call.id, status: 'ringing' };
      if (advisory.warning) {
        response.warning = advisory.warning;
        response.nextOpenAt = advisory.nextOpenAt ?? null;
        if (advisory.closure) response.closure = advisory.closure;
      }
      res.status(200).json(response);
      return;
    } catch (e) {
      logger.error({ error: e }, 'dial: failed to create call');
      if (e instanceof NotInContactsError) {
        res.status(403).json({ error: e.message, code: 'NOT_IN_CONTACTS' });
        return;
      }
      res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to dial call' });
      return;
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
      return;
    } catch (e) {
      logger.error({ error: e }, 'calls: failed to accept call');
      res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to accept call' });
      return;
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
      return;
    } catch (e) {
      logger.error({ error: e }, 'calls: failed to decline call');
      res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to decline call' });
      return;
    }
  }, 'Failed to decline call'));

  return router;
}

// Default export for individual role (used in routes/index.ts)
export default createCallsRouter('individual');
