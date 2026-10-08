/**
 * Voice transport for v11 role-based calls.
 *
 * One "room" per call (Map<callId, Room>):
 * - businessSocket: the business participant (has mic, receives agent audio)
 * - individualSockets: the individual participant(s) (observer only, no mic)
 * - One shared Gemini session per call
 *
 * Wire protocol (JSON messages over the WebSocket):
 *   → { type: "start", callId }                                               client → server
 *   → { type: "audio", payload: "<base64 pcm16 16kHz>" }                      client → server
 *   → { type: "stop" }                                                        client → server
 *   ← { type: "ready", role: "business"|"individual", history }                server → individual
 *   ← { type: "audio", payload: "<base64 pcm16 24kHz>" }                       server → business
 *   ← { type: "transcript", role: "business"|"agent", text }                  server → both
 *   ← { type: "call_ended", reason }                                           server → both
 *   ← { type: "error", message }                                               server → client
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import { prisma } from '@workspace/db-prisma';
import { browserPayloadToPcm16, pcm16ToBrowserPayload } from '../lib/audioCodec';
import { openGeminiLiveSession, type GeminiVoiceSession } from './geminiVoiceSession';
import { buildAgentCallSystemInstruction } from './callAnalysis';
import { createCallLifecycle } from './callLifecycle';
import { logger } from '../lib/logger';
import { sendToAccount } from './presence';
import { roleInCall, recipientIdOf, initiatorIdOf, type CallRole } from './callSignaling';

interface Room {
  callId: string;
  businessSocket: WebSocket | null;
  individualSockets: Set<WebSocket>;
  gemini: GeminiVoiceSession | null;
  lifecycle: ReturnType<typeof createCallLifecycle> | null;
  individualId: string;
  businessId: string;
  initiatedBy: string;
  history: Array<{ role: string; text: string }>;
}

const rooms = new Map<string, Room>();

/**
 * Exported for testing: retrieves the task context for a call based on call.taskId
 */
export async function getTaskContextForCall(
  taskId: string | null | undefined,
  contactId: string
): Promise<{ title: string; description: string | null } | null> {
  if (!taskId) return null;

  const task = await prisma.task.findFirst({
    where: { id: taskId, contactId },
    select: { title: true, description: true },
  });

  return task ? { title: task.title, description: task.description } : null;
}

export function createServiceVoiceStream(): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const userId = (req as any).userId;
    let callId: string | null = null;
    let role: CallRole | null = null;

    ws.on('message', async (raw) => {
      let msg: any;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      switch (msg.type) {
        case 'start': {
          try {
            const callIdParam: string = msg.callId;

            if (!callIdParam || !userId) {
              ws.send(JSON.stringify({ type: 'error', message: 'Missing callId or userId' }));
              return;
            }

            callId = callIdParam;

            // Verify the call exists and has individualId/businessId set
            const call = await prisma.call.findUnique({
              where: { id: callIdParam },
              select: {
                id: true,
                status: true,
                individualId: true,
                businessId: true,
                initiatedBy: true,
                contactId: true,
                conversationId: true,
                startedAt: true,
                taskId: true,
                contact: {
                  select: {
                    id: true,
                    name: true,
                    ownerId: true,
                  },
                },
              },
            });

            if (!call) {
              ws.send(JSON.stringify({ type: 'error', message: 'Call not found' }));
              return;
            }

            // Reject calls without individualId/businessId
            if (!call.individualId || !call.businessId) {
              ws.send(JSON.stringify({ type: 'error', message: 'Call is not between an individual and a business' }));
              logger.warn({ callId: callIdParam }, 'voiceStreamService: call missing individualId or businessId');
              return;
            }

            // Determine the user's role in this call
            role = roleInCall(call, userId);
            if (!role) {
              ws.send(JSON.stringify({ type: 'error', message: 'You are not a participant in this call' }));
              return;
            }

            // Get or create the room
            let room = rooms.get(callIdParam);
            if (!room) {
              // Create new room
              room = {
                callId: callIdParam,
                businessSocket: null,
                individualSockets: new Set(),
                gemini: null,
                lifecycle: null,
                individualId: call.individualId,
                businessId: call.businessId,
                initiatedBy: call.initiatedBy || 'individual',
                history: [],
              };
              rooms.set(callIdParam, room);
            }

            // Join logic based on role
            if (role === 'business') {
              // Business joining
              if (room.businessSocket && room.businessSocket !== ws) {
                ws.send(JSON.stringify({ type: 'error', message: 'Business already connected to this call' }));
                return;
              }

              // Business can only join when call is "in-progress" (not during ringing)
              if (call.status !== 'in-progress') {
                ws.send(JSON.stringify({ type: 'error', message: `Call is not in progress (status: ${call.status})` }));
                return;
              }

              room.businessSocket = ws;
              logger.info({ callId: callIdParam, userId }, 'voiceStreamService: business joined call');

              // If gemini session doesn't exist yet, create it
              if (!room.gemini) {
                await startGeminiSession(room, call);
              }

              ws.send(JSON.stringify({ type: 'ready', role: 'business' }));
            } else {
              // Individual joining
              room.individualSockets.add(ws);
              logger.info({ callId: callIdParam, userId }, 'voiceStreamService: individual joined call');

              // If individual is the recipient and call is "ringing", auto-accept
              const recipientId = recipientIdOf(call);
              if (userId === recipientId && call.status === 'ringing') {
                logger.info({ callId: callIdParam, userId }, 'voiceStreamService: individual accepting call during join');

                await prisma.call.update({
                  where: { id: callIdParam },
                  data: {
                    status: 'in-progress',
                    acceptedAt: new Date(),
                    startedAt: new Date(),
                  },
                });

                // Notify the initiator that the call was accepted
                const initiatorId = initiatorIdOf(call);
                if (initiatorId) {
                  sendToAccount(initiatorId, {
                    type: 'call_status',
                    callId: callIdParam,
                    status: 'in-progress',
                  });
                }

                // Refresh call data
                const updatedCall = await prisma.call.findUnique({
                  where: { id: callIdParam },
                  select: { status: true },
                });

                if (updatedCall?.status !== 'in-progress') {
                  ws.send(JSON.stringify({ type: 'error', message: 'Failed to accept call' }));
                  return;
                }
              }

              // If gemini session exists, send history replay
              if (room.gemini) {
                ws.send(JSON.stringify({
                  type: 'ready',
                  role: 'individual',
                  history: room.history,
                }));
              } else {
                // If no gemini session yet, individual is waiting for business to join
                ws.send(JSON.stringify({
                  type: 'ready',
                  role: 'individual',
                  history: [],
                }));
              }
            }
          } catch (err) {
            logger.error({ err }, 'voiceStreamService: failed to start session');
            ws.send(
              JSON.stringify({
                type: 'error',
                message: err instanceof Error ? err.message : 'Failed to start voice session',
              })
            );
          }
          break;
        }

        case 'audio': {
          if (!callId || !role) return;

          const room = rooms.get(callId);
          if (!room) return;

          // Only business audio is sent to Gemini
          if (role === 'business' && room.gemini) {
            if (typeof msg.payload !== 'string') return;
            if (!msg.payload || msg.payload.length === 0) return;

            try {
              const pcm24k = browserPayloadToPcm16(msg.payload);
              if (pcm24k.length === 0) return;
              room.gemini.sendAudio(pcm24k);
            } catch (err) {
              logger.error({ err }, 'voiceStreamService: failed to process audio');
            }
          }
          // Individual audio is ignored
          break;
        }

        case 'stop':
          if (callId) {
            await endCall(callId, userId);
          }
          break;
      }
    });

    ws.on('close', async () => {
      if (!callId || !role) return;

      const room = rooms.get(callId);
      if (!room) return;

      if (role === 'business') {
        // Business socket closing ends the call
        logger.info({ callId }, 'voiceStreamService: business socket closed, ending call');
        await endCall(callId, userId);
      } else {
        // Individual socket closing does not end the call
        room.individualSockets.delete(ws);
        logger.info({ callId, remainingIndividuals: room.individualSockets.size }, 'voiceStreamService: individual socket closed');
      }
    });

    ws.on('error', (err) => {
      logger.error({ err }, 'voiceStreamService: WebSocket error');
    });
  });

  return wss;
}

async function startGeminiSession(room: Room, call: any) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: call.conversationId },
  });

  if (!conversation) {
    throw new Error('Conversation not found');
  }

  // Load contact knowledge
  const knowledgeFacts = await prisma.contactKnowledge.findMany({
    where: { contactId: call.contactId, status: 'active' },
    orderBy: { category: 'asc' },
  });

  // Get individual and business names
  const individual = await prisma.account.findUnique({
    where: { id: room.individualId },
    select: { name: true, timezone: true },
  });

  const business = await prisma.account.findUnique({
    where: { id: room.businessId },
    select: { name: true },
  });

  if (!individual || !business) {
    throw new Error('Individual or business account not found');
  }

  const taskContext = await getTaskContextForCall(call.taskId, call.contactId);
  const startedAt = call.startedAt ? new Date(call.startedAt) : new Date();
  const tz = individual.timezone ?? process.env.DEFAULT_TIMEZONE ?? 'Asia/Kolkata';

  // Determine direction
  const direction = room.initiatedBy === 'individual' ? 'outbound' : 'inbound';

  room.lifecycle = createCallLifecycle({
    callId: call.id,
    conversationId: conversation.id,
    ownerId: room.individualId, // Always use individualId for lifecycle
    contactId: call.contactId,
    startedAt,
    send: (msg) => {
      // Send to business socket
      if (room.businessSocket) {
        room.businessSocket.send(JSON.stringify(msg));
      }
      // Send transcript to individual sockets
      const transcriptMsg = msg as { type?: string; role?: string; text?: string };
      if (transcriptMsg.type === 'transcript' && transcriptMsg.role && transcriptMsg.text) {
        room.history.push({ role: transcriptMsg.role, text: transcriptMsg.text });
        room.individualSockets.forEach(ws => {
          ws.send(JSON.stringify(msg));
        });
      }
    },
    closeSocket: () => {
      if (room.businessSocket) {
        room.businessSocket.close();
      }
    },
    getGemini: () => room.gemini,
    clearGemini: () => { room.gemini = null; },
  });

  room.gemini = await openGeminiLiveSession({
    systemInstructionText: buildAgentCallSystemInstruction({
      individualName: individual.name,
      businessName: business.name,
      direction,
      knowledgeFacts,
      taskContext,
      timezone: tz,
    }),
    onAudioOut: (pcm24k) => {
      room.lifecycle?.noteAudioOut(pcm24k);
      // Send audio only to business socket
      if (room.businessSocket) {
        room.businessSocket.send(JSON.stringify({ type: 'audio', payload: pcm16ToBrowserPayload(pcm24k) }));
      }
    },
    onUserTurnText: (text) => {
      void room.lifecycle?.logTurn('user', text);
      room.history.push({ role: 'business', text });
      // Send transcript to both business and individual
      const msg = JSON.stringify({ type: 'transcript', role: 'business', text });
      if (room.businessSocket) {
        room.businessSocket.send(msg);
      }
      room.individualSockets.forEach(ws => ws.send(msg));
    },
    onAgentTurnText: (text) => {
      void room.lifecycle?.logTurn('assistant', text);
      room.history.push({ role: 'agent', text });
      // Send transcript to both business and individual
      const msg = JSON.stringify({ type: 'transcript', role: 'agent', text });
      if (room.businessSocket) {
        room.businessSocket.send(msg);
      }
      room.individualSockets.forEach(ws => ws.send(msg));
    },
    onAskUser: (args) => room.lifecycle?.onAskUser(args) ?? Promise.resolve('USER_UNAVAILABLE'),
    onEndCallRequested: (args) => room.lifecycle?.onEndCall(args),
    onClosed: () => room.lifecycle?.onGeminiClosed(),
  });

  logger.info({ callId: call.id }, 'voiceStreamService: Gemini session started');
}

async function endCall(callId: string, userId: string) {
  const room = rooms.get(callId);
  if (!room) return;

  await room.lifecycle?.end('user');

  // Close all sockets
  if (room.businessSocket) {
    room.businessSocket.close();
  }
  room.individualSockets.forEach(ws => ws.close());

  // Clear gemini session
  if (room.gemini) {
    await room.gemini.close();
    room.gemini = null;
  }

  // Remove room
  rooms.delete(callId);

  logger.info({ callId, userId }, 'voiceStreamService: call ended, room cleaned up');
}
