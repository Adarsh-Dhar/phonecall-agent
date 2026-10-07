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

export function createServiceVoiceStream(): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  wss.on("connection", (serviceWs: WebSocket, req: IncomingMessage) => {
    let gemini: GeminiVoiceSession | null = null;
    let lifecycle: ReturnType<typeof createCallLifecycle> | null = null;
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

            const tz = call.contact.timezone ?? process.env.DEFAULT_TIMEZONE ?? "Asia/Kolkata";

            let taskContext: { title: string; description: string | null } | null = null;
            const task = call.taskId ? await prisma.task.findFirst({
              where: { id: call.taskId, contactId: call.contactId },
            }) : null;
            if (task) {
              taskContext = { title: task.title, description: task.description };
            }

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
                personalUser.name,
                call.contact.name,
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
              onAskUser: (args) => lifecycle?.onAskUser(args),
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
            return;
          }
          if (typeof msg.payload !== "string") return;

          if (!msg.payload || msg.payload.length === 0) {
            return;
          }

          try {
            const pcm24k = browserPayloadToPcm16(msg.payload);
            if (pcm24k.length === 0) {
              return;
            }
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

    serviceWs.on("close", () => {
      void lifecycle?.end("user");
    });

    serviceWs.on("error", (err) => {
      logger.error({ err }, "voiceStreamService: service WebSocket error");
      void lifecycle?.end("user");
    });
  });

  return wss;
}