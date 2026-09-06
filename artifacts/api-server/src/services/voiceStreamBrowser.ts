/**
 * Browser test-call transport — the only voice transport in this app.
 *
 * A plain WebSocket from a browser mic feeds the Gemini Live pipeline
 * (STT+LLM+TTS in one streaming session) and plays the response back through
 * the Web Audio API. No telephony carrier, no phone number, no per-minute
 * cost — every "call" happens over your own network connection.
 *
 * Wire protocol (JSON messages over the WebSocket):
 *   → { type: "start", contactId?: string, taskId?: string, userId?: string }  browser → server
 *   → { type: "audio", payload: "<base64 pcm16 16kHz>" }                      browser → server
 *   → { type: "stop" }                                                        browser → server
 *   ← { type: "ready", callId, conversationId }                                server → browser
 *   ← { type: "audio", payload: "<base64 pcm16 24kHz>" }                       server → browser
 *   ← { type: "transcript", role: "user"|"assistant", text }                   server → browser
 *   ← { type: "call_ended", reason: "agent"|"user" }                            server → browser
 *   ← { type: "error", message }                                               server → browser
 */

import { WebSocketServer, WebSocket } from "ws";
import { prisma } from "@workspace/db-prisma";
import { browserPayloadToPcm16, pcm16ToBrowserPayload } from "../lib/audioCodec";
import { openGeminiLiveSession, type GeminiVoiceSession } from "./geminiVoiceSession";
import { scheduleExtraction } from "./taskExtraction";
import { buildCallSystemInstruction } from "./callAnalysis";
import { analyzeCallForEscalation } from "./callAnalysis";
import { getOrCreateActiveConversation } from "./conversations";
import { logger } from "../lib/logger";

// A fixed synthetic contact that all browser test calls are logged against,
// so they show up in the normal Contact/Conversation/Task UI without needing
// a real phone number. Created lazily on first use, scoped to the login account
// that initiates the call (via userId in the "start" message).
const TEST_CONTACT_NAME = "Browser Test";

async function getOrCreateTestContact(ownerId: string) {
  // Look for an existing Browser Test service account owned by this login account
  let contact = await prisma.account.findFirst({
    where: { name: TEST_CONTACT_NAME, ownerId, isService: true },
  });
  if (!contact) {
    contact = await prisma.account.create({
      data: {
        isService: true,
        ownerId,
        name:      TEST_CONTACT_NAME,
        business:  "Local dev / browser test",
        category:  "Other",
        phone:     "browser-test",
        initials:  "BT",
        color:     "#6366f1",
        note:      "Auto-created contact for free, in-browser microphone test calls (no telephony involved).",
      },
    });
  }
  return contact;
}

export function createBrowserVoiceStream(): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  wss.on("connection", (browserWs: WebSocket) => {
    let gemini: GeminiVoiceSession | null = null;
    let callId: string | null = null;
    let conversationId: string | null = null;
    let startedAt: Date | null = null;

    browserWs.on("message", async (raw) => {
      let msg: any;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      switch (msg.type) {
        case "start": {
          try {
            const contactId: string | undefined = msg.contactId;
            const taskId: string | undefined    = msg.taskId;
            // userId is supplied by the browser from its JWT-decoded session so
            // we can scope the test contact to the correct login account.
            const userId: string | undefined    = msg.userId;

            let contact;

            if (contactId) {
              // Specific contact requested — look it up directly
              contact = await prisma.account.findFirst({
                where: { id: contactId, isService: true },
              });
            } else if (userId) {
              // No specific contact — use / create the Browser Test service account
              contact = await getOrCreateTestContact(userId);
            } else {
              // Fallback for environments where userId is not passed: use the
              // first login account's Browser Test contact (dev-only convenience)
              const firstLoginAccount = await prisma.account.findFirst({
                where: { isService: false },
                orderBy: { createdAt: "asc" },
              });
              if (firstLoginAccount) {
                contact = await getOrCreateTestContact(firstLoginAccount.id);
              }
            }

            if (!contact) {
              browserWs.send(JSON.stringify({ type: "error", message: "Contact not found" }));
              return;
            }

            // If this call was triggered from a specific task (e.g. "Call"
            // on a calendar event), pull its title/description in so the
            // agent opens the call already knowing what it's calling about.
            let taskContext: { title: string; description: string | null } | null = null;
            if (taskId) {
              const task = await prisma.task.findUnique({ where: { id: taskId } });
              if (task && task.contactId === contact.id) {
                taskContext = { title: task.title, description: task.description };
              } else if (task) {
                logger.warn(
                  { taskId, taskContactId: task.contactId, contactId: contact.id },
                  "voiceStreamBrowser: taskId does not belong to contact, ignoring"
                );
              }
            }

            const conversation = await getOrCreateActiveConversation(
              contact.id,
              "Browser test call with",
              contact.name
            );
            conversationId = conversation.id;

            startedAt = new Date();
            const call = await prisma.call.create({
              data: {
                status:         "in-progress",
                direction:      "outbound",
                conversationId: conversation.id,
                contactId:      contact.id,
                from:           "browser",
                to:             "browser",
                startedAt,
              },
            });
            callId = call.id;

            const knowledgeFacts = await prisma.contactKnowledge.findMany({
              where: { contactId: contact.id, status: "active" },
              orderBy: { category: "asc" },
            });

            gemini = await openGeminiLiveSession({
              systemInstructionText: buildCallSystemInstruction(contact.name, knowledgeFacts, taskContext),
              onAudioOut: (pcm24k) => {
                browserWs.send(JSON.stringify({ type: "audio", payload: pcm16ToBrowserPayload(pcm24k) }));
              },
              onUserTurnText: (text) => {
                void logTurn("user", text);
                browserWs.send(JSON.stringify({ type: "transcript", role: "user", text }));
              },
              onAgentTurnText: (text) => {
                void logTurn("assistant", text);
                browserWs.send(JSON.stringify({ type: "transcript", role: "assistant", text }));
              },
              onEndCallRequested: () => {
                logger.info({ callId }, "voiceStreamBrowser: agent requested to end the call");
                try {
                  browserWs.send(JSON.stringify({ type: "call_ended", reason: "agent" }));
                } catch (err) {
                  logger.warn({ err }, "voiceStreamBrowser: failed to notify browser of call_ended");
                }
                // Give the last bit of audio a moment to actually reach the
                // browser before we tear the socket down.
                setTimeout(() => {
                  void endCall("agent");
                  browserWs.close();
                }, 800);
              },
            });

            // Wait a moment for the session to stabilize
            await new Promise(resolve => setTimeout(resolve, 500));

            browserWs.send(JSON.stringify({ type: "ready", callId, conversationId }));
          } catch (err) {
            logger.error({ err }, "voiceStreamBrowser: failed to start session");
            browserWs.send(
              JSON.stringify({
                type:    "error",
                message: err instanceof Error ? err.message : "Failed to start voice session",
              })
            );
          }
          break;
        }

        case "audio": {
          if (!gemini || typeof msg.payload !== "string") return;

          // Skip empty payloads - don't send silence to Gemini
          if (!msg.payload || msg.payload.length === 0) {
            logger.debug("voiceStreamBrowser: skipping empty audio payload");
            return;
          }

          logger.info({
            payloadLength: msg.payload.length,
            payloadStart:  msg.payload.substring(0, 100),
            payloadEnd:    msg.payload.substring(msg.payload.length - 100)
          }, "voiceStreamBrowser: received audio payload");

          const pcm24k = browserPayloadToPcm16(msg.payload);
          logger.info({
            pcm24kLength:  pcm24k.length,
            sampleValues:  Array.from(pcm24k.slice(0, 10)),
            maxAmplitude:  Math.max(...Array.from(pcm24k.map(Math.abs)))
          }, "voiceStreamBrowser: resampled to 24k");

          // Skip sending if resampled audio is empty
          if (pcm24k.length === 0) {
            logger.debug("voiceStreamBrowser: skipping empty resampled audio");
            return;
          }

          gemini.sendAudio(pcm24k);
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
          logger.error({ err, role, currentConversationId }, "voiceStreamBrowser: failed to log turn");
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
          logger.error({ err, callId: currentCallId }, "voiceStreamBrowser: post-call analysis failed")
        );
      }

      callId         = null;
      conversationId = null;
      startedAt      = null;
    }

    browserWs.on("close", () => {
      logger.info("voiceStreamBrowser: browser WebSocket closed");
      void endCall();
    });

    browserWs.on("error", (err) => {
      logger.error({ err }, "voiceStreamBrowser: browser WebSocket error");
      void endCall();
    });
  });

  return wss;
}
