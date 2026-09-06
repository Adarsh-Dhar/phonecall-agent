/**
 * Service-account voice transport — handles real calls between personal users
 * and service accounts via WebSocket.
 *
 * Wire protocol (JSON messages over the WebSocket):
 *   → { type: "start", callId }                                               service → server
 *   → { type: "audio", payload: "<base64 pcm16 16kHz>" }                      service → server
 *   → { type: "stop" }                                                        service → server
 *   ← { type: "ready", callId, conversationId }                                server → service
 *   ← { type: "audio", payload: "<base64 pcm16 24kHz>" }                       server → service
 *   ← { type: "transcript", role: "user"|"assistant", text }                   server → service
 *   ← { type: "call_ended", reason: "agent"|"user" }                            server → service
 *   ← { type: "error", message }                                               server → service
 */

import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage } from "http";
import { prisma } from "@workspace/db-prisma";
import { browserPayloadToPcm16, pcm16ToBrowserPayload } from "../lib/audioCodec";
import { openGeminiLiveSession, type GeminiVoiceSession } from "./geminiVoiceSession";
import { scheduleExtraction } from "./taskExtraction";
import { buildOutboundCallSystemInstruction } from "./callAnalysis";
import { analyzeCallForEscalation } from "./callAnalysis";
import { logger } from "../lib/logger";

export function createServiceVoiceStream(): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  wss.on("connection", (serviceWs: WebSocket, req: IncomingMessage) => {
    let gemini: GeminiVoiceSession | null = null;
    let callId: string | null = null;
    let conversationId: string | null = null;
    let startedAt: Date | null = null;
    const userId = (req as any).userId;

    serviceWs.on("message", async (raw) => {
      let msg: any;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      switch (msg.type) {
        case "start": {
          try {
            const callIdParam: string = msg.callId;

            if (!callIdParam || !userId) {
              serviceWs.send(JSON.stringify({ type: "error", message: "Missing callId or userId" }));
              return;
            }

            // Verify the call exists and belongs to this user as the callee
            const call = await prisma.call.findUnique({
              where: { id: callIdParam },
              include: {
                contact: {
                  select: {
                    id: true,
                    name: true,
                    ownerId: true,
                    linkedAccountId: true,
                  },
                },
              },
            });

            if (!call) {
              serviceWs.send(JSON.stringify({ type: "error", message: "Call not found" }));
              return;
            }

            // Security check: verify this user is the callee and call is in-progress
            if (call.calleeAccountId !== userId) {
              serviceWs.send(JSON.stringify({ type: "error", message: "You are not authorized to join this call" }));
              logger.warn({ callId: callIdParam, userId }, "voiceStreamService: unauthorized call access attempt");
              return;
            }

            if (call.status !== "in-progress") {
              serviceWs.send(JSON.stringify({ type: "error", message: `Call is not in progress (status: ${call.status})` }));
              return;
            }

            // Load conversation
            const conversation = await prisma.conversation.findUnique({
              where: { id: call.conversationId },
            });

            if (!conversation) {
              serviceWs.send(JSON.stringify({ type: "error", message: "Conversation not found" }));
              return;
            }

            // Load contact knowledge from the mirror contact
            const knowledgeFacts = await prisma.contactKnowledge.findMany({
              where: { contactId: call.contactId, status: "active" },
              orderBy: { category: "asc" },
            });

            // Load the personal user's account (caller identity)
            const personalUser = await prisma.account.findUnique({
              where: { id: call.contact.ownerId ?? undefined },
              select: { name: true },
            });

            if (!personalUser) {
              serviceWs.send(JSON.stringify({ type: "error", message: "Caller account not found" }));
              return;
            }

            // Load task context if the call was triggered from a task
            let taskContext: { title: string; description: string | null } | null = null;
            const task = await prisma.task.findFirst({
              where: { contactId: call.contactId },
              orderBy: { createdAt: "desc" },
            });
            if (task) {
              taskContext = { title: task.title, description: task.description };
            }

            callId = call.id;
            conversationId = conversation.id;
            startedAt = call.startedAt ? new Date(call.startedAt) : new Date();

            gemini = await openGeminiLiveSession({
              systemInstructionText: buildOutboundCallSystemInstruction(
                personalUser.name,
                call.contact.name,
                knowledgeFacts,
                taskContext
              ),
              onAudioOut: (pcm24k) => {
                serviceWs.send(JSON.stringify({ type: "audio", payload: pcm16ToBrowserPayload(pcm24k) }));
              },
              onUserTurnText: (text) => {
                void logTurn("user", text);
                serviceWs.send(JSON.stringify({ type: "transcript", role: "user", text }));
              },
              onAgentTurnText: (text) => {
                void logTurn("assistant", text);
                serviceWs.send(JSON.stringify({ type: "transcript", role: "assistant", text }));
              },
              onEndCallRequested: () => {
                logger.info({ callId }, "voiceStreamService: agent requested to end the call");
                try {
                  serviceWs.send(JSON.stringify({ type: "call_ended", reason: "agent" }));
                } catch (err) {
                  logger.warn({ err }, "voiceStreamService: failed to notify service of call_ended");
                }
                // Give the last bit of audio a moment to actually reach the
                // service before we tear the socket down.
                setTimeout(() => {
                  void endCall("agent");
                  serviceWs.close();
                }, 800);
              },
            });

            // Wait a moment for the session to stabilize
            await new Promise(resolve => setTimeout(resolve, 500));

            serviceWs.send(JSON.stringify({ type: "ready", callId, conversationId }));
          } catch (err) {
            logger.error({ err }, "voiceStreamService: failed to start session");
            serviceWs.send(
              JSON.stringify({
                type:    "error",
                message: err instanceof Error ? err.message : "Failed to start voice session",
              })
            );
          }
          break;
        }

        case "audio": {
          if (!gemini) {
            logger.warn("voiceStreamService: audio received before gemini session was ready");
            return;
          }
          if (typeof msg.payload !== "string") return;

          // Skip empty payloads - don't send silence to Gemini
          if (!msg.payload || msg.payload.length === 0) {
            logger.debug("voiceStreamService: skipping empty audio payload");
            return;
          }

          try {
            logger.info({
              payloadLength: msg.payload.length,
            }, "voiceStreamService: received audio payload");

            const pcm24k = browserPayloadToPcm16(msg.payload);

            logger.info({
              pcm24kLength: pcm24k.length,
              maxAmplitude: pcm24k.length ? Math.max(...Array.from(pcm24k.map(Math.abs))) : 0,
            }, "voiceStreamService: resampled to 24k");

            // Skip sending if resampled audio is empty
            if (pcm24k.length === 0) {
              logger.debug("voiceStreamService: skipping empty resampled audio");
              return;
            }

            gemini.sendAudio(pcm24k);
          } catch (err) {
            logger.error({ err }, "voiceStreamService: failed to process/send audio chunk");
          }
          break;
        }

        case "stop":
          await endCall();
          break;
      }
    });

    // Serializes logTurn's DB writes so createdAt order always matches
    // conversation order, even though onUserTurnText/onAgentTurnText fire
    // fire-and-forget `void logTurn(...)`) — without this, two unawaited
    // prisma.message.create calls can resolve out of order under load and
    // leave the persisted transcript showing the agent before the user.
    let turnLogQueue: Promise<void> = Promise.resolve();

    async function logTurn(role: "user" | "assistant", content: string) {
      if (!conversationId) return;
      const currentConversationId = conversationId;
      const currentCallId = callId;
      turnLogQueue = turnLogQueue
        .then(() =>
          prisma.message.create({
            data: {
              role,
              content,
              time:           "Now",
              conversationId: currentConversationId,
              callId:         currentCallId,
            },
          })
        )
        .then(() => {
          scheduleExtraction(currentConversationId);
        })
        .catch((err) => {
          logger.error({ err, role, currentConversationId }, "voiceStreamService: failed to log turn");
        });
      await turnLogQueue;
    }

    async function endCall(disconnectedBy: "user" | "agent" = "user") {
      const currentCallId    = callId;    // Capture before clearing
      const currentStartedAt = startedAt; // Capture before clearing

      gemini?.close();
      gemini = null;

      if (currentCallId && currentStartedAt) {
        const endedAt = new Date();
        await prisma.call.update({
          where: { id: currentCallId },
          data: {
            status:        "completed",
            endedAt,
            durationSec:   Math.round((endedAt.getTime() - currentStartedAt.getTime()) / 1000),
            disconnectedBy,
          },
        });
        void analyzeCallForEscalation(currentCallId).catch((err) =>
          logger.error({ err, callId: currentCallId }, "voiceStreamService: post-call analysis failed")
        );
      }

      callId         = null;
      conversationId = null;
      startedAt      = null;
    }

    serviceWs.on("close", () => {
      logger.info("voiceStreamService: service WebSocket closed");
      void endCall();
    });

    serviceWs.on("error", (err) => {
      logger.error({ err }, "voiceStreamService: service WebSocket error");
      void endCall();
    });
  });

  return wss;
}