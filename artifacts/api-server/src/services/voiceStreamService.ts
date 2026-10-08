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
import { buildOutboundCallSystemInstruction } from "./callAnalysis";
import { createCallLifecycle } from "./callLifecycle";
import { logger } from "../lib/logger";
import { sendToAccount } from "./presence";

/**
 * Exported for testing: retrieves the task context for a call based on call.taskId
 * Returns the task if it exists and belongs to the contact, null otherwise
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

  wss.on("connection", (serviceWs: WebSocket, req: IncomingMessage) => {
    let gemini: GeminiVoiceSession | null = null;
    let lifecycle: ReturnType<typeof createCallLifecycle> | null = null;
    let callId: string | null = null;
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

            // Store callId for the close handler
            callId = callIdParam;

            // Verify the call exists and belongs to this user as the callee
            let call = await prisma.call.findUnique({
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

            // Security check: verify this user is authorized to join the call
            // User can join if they are:
            // 1. The callee (the one being called)
            // 2. The owner of the contact that made the call (the caller)
            const isCallee = call.calleeAccountId === userId;
            const isCaller = call.contact.ownerId === userId;

            if (!isCallee && !isCaller) {
              serviceWs.send(JSON.stringify({ type: "error", message: "You are not authorized to join this call" }));
              logger.warn({ callId: callIdParam, userId, calleeAccountId: call.calleeAccountId, contactOwnerId: call.contact.ownerId }, "voiceStreamService: unauthorized call access attempt");
              return;
            }

            // Call status check:
            // - Callee can join if call is "ringing" (they are accepting now) or "in-progress" (already accepted)
            // - Caller can only join if call is "in-progress" (callee must accept first)
            if (isCallee && call.status !== "in-progress" && call.status !== "ringing") {
              serviceWs.send(JSON.stringify({ type: "error", message: `Call is not in progress (status: ${call.status})` }));
              logger.warn({ callId: callIdParam, userId, status: call.status }, "voiceStreamService: callee tried to join with invalid call status");
              return;
            }

            if (isCaller && call.status !== "in-progress") {
              serviceWs.send(JSON.stringify({ type: "error", message: `Call is not in progress (status: ${call.status})` }));
              logger.warn({ callId: callIdParam, userId, status: call.status }, "voiceStreamService: caller tried to join with invalid call status");
              return;
            }

            // If callee is joining during "ringing", automatically accept the call
            if (isCallee && call.status === "ringing") {
              logger.info({ callId: callIdParam, userId }, "voiceStreamService: callee accepting call during voice stream connection");

              await prisma.call.update({
                where: { id: callIdParam },
                data: {
                  status: "in-progress",
                  acceptedAt: new Date(),
                  startedAt: new Date(),
                },
              });

              // Notify the caller that the call was accepted
              const conversation = await prisma.conversation.findUnique({
                where: { id: call.conversationId },
                select: { contact: { select: { ownerId: true } } },
              });

              if (conversation?.contact?.ownerId) {
                sendToAccount(conversation.contact.ownerId, {
                  type: "call_status",
                  callId: callIdParam,
                  status: "in-progress",
                });
                logger.info({ callId: callIdParam, callerId: conversation.contact.ownerId }, "voiceStreamService: notified caller of acceptance");
              }

              // Refresh call data after status update
              call = await prisma.call.findUnique({
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
                serviceWs.send(JSON.stringify({ type: "error", message: "Call not found after acceptance" }));
                return;
              }
            }

            logger.info({ callId: callIdParam, userId, status: call.status, isCaller, isCallee }, "voiceStreamService: proceeding to create voice session");

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

            // Determine who the AI represents and who it's speaking with
            // The AI represents the PERSON receiving the call (the callee), not the caller
            let onBehalfOfName: string;
            let speakingWithName: string;
            let tz: string;

            // The AI speaks on behalf of the CALLEE (the person being called)
            // Get the callee's account
            const calleeAccount = await prisma.account.findUnique({
              where: { id: call.calleeAccountId ?? undefined },
              select: {
                name: true,
                timezone: true,
              },
            });

            onBehalfOfName = calleeAccount?.name || "Unknown";
            tz = calleeAccount?.timezone ?? process.env.DEFAULT_TIMEZONE ?? "Asia/Kolkata";

            // The AI is speaking with the caller (the business/service account that made the call)
            // The caller is represented by call.contact
            speakingWithName = call.contact.name;

            logger.info({
              onBehalfOfName,
              speakingWithName,
              calleeAccountId: call.calleeAccountId,
              contactName: call.contact.name,
              isCaller,
              isCallee,
              userId
            }, "voiceStreamService: AI represents callee, speaks with caller");

            let taskContext: { title: string; description: string | null } | null = null;
            taskContext = await getTaskContextForCall(call.taskId, call.contactId);

            const startedAt = call.startedAt ? new Date(call.startedAt) : new Date();

            lifecycle = createCallLifecycle({
              callId: call.id,
              conversationId: conversation.id,
              ownerId: call.contact.ownerId ?? "",
              contactId: call.contactId,
              startedAt,
              send: (msg) => serviceWs.send(JSON.stringify(msg)),
              closeSocket: () => serviceWs.close(),
              getGemini: () => gemini,
              clearGemini: () => { gemini = null; },
            });

            gemini = await openGeminiLiveSession({
              systemInstructionText: buildOutboundCallSystemInstruction(
                onBehalfOfName,
                speakingWithName,
                knowledgeFacts,
                taskContext,
                tz
              ),
              onAudioOut: (pcm24k) => {
                lifecycle?.noteAudioOut(pcm24k);
                serviceWs.send(JSON.stringify({ type: "audio", payload: pcm16ToBrowserPayload(pcm24k) }));
              },
              onUserTurnText: (text) => {
                void lifecycle?.logTurn("user", text);
                serviceWs.send(JSON.stringify({ type: "transcript", role: "user", text }));
              },
              onAgentTurnText: (text) => {
                void lifecycle?.logTurn("assistant", text);
                serviceWs.send(JSON.stringify({ type: "transcript", role: "assistant", text }));
              },
              onAskUser: (args) => lifecycle?.onAskUser(args) ?? Promise.resolve('USER_UNAVAILABLE'),
              onEndCallRequested: (args) => lifecycle?.onEndCall(args),
              onClosed: () => lifecycle?.onGeminiClosed(),
            });

            await new Promise((resolve) => setTimeout(resolve, 500));

            serviceWs.send(JSON.stringify({ type: "ready", callId: call.id, conversationId: conversation.id }));
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
            logger.warn("voiceStreamService: received audio but gemini session not ready");
            return;
          }
          if (typeof msg.payload !== "string") {
            logger.warn("voiceStreamService: received audio with invalid payload type");
            return;
          }

          if (!msg.payload || msg.payload.length === 0) {
            logger.warn("voiceStreamService: received empty audio payload");
            return;
          }

          try {
            const pcm24k = browserPayloadToPcm16(msg.payload);
            if (pcm24k.length === 0) {
              logger.warn("voiceStreamService: decoded audio is empty");
              return;
            }
            logger.debug({ payloadLength: msg.payload.length, pcmLength: pcm24k.length }, "voiceStreamService: sending audio to gemini");
            gemini.sendAudio(pcm24k);
          } catch (err) {
            logger.error({ err }, "voiceStreamService: failed to process/send audio chunk");
          }
          break;
        }

        case "stop":
          await lifecycle?.end("user");
          break;
      }
    });

    serviceWs.on("close", async () => {
      // Only end the call if we actually started a session (lifecycle exists)
      // If the socket closes during the "ringing" wait period, don't mark the call as completed
      if (lifecycle) {
        await lifecycle.end("user");
      } else if (callId) {
        // Socket closed before session started - check if call is still ringing
        // If so, this was a premature disconnect during waiting, don't complete the call
        const call = await prisma.call.findUnique({
          where: { id: callId },
          select: { status: true },
        });
        if (call?.status === "ringing") {
          logger.info({ callId }, "voiceStreamService: socket closed during ringing, not completing call");
        }
      }
    });

    serviceWs.on("error", (err) => {
      logger.error({ err }, "voiceStreamService: service WebSocket error");
      // Only end the call if we actually started a session
      if (lifecycle) {
        void lifecycle.end("user");
      }
    });
  });

  return wss;
}