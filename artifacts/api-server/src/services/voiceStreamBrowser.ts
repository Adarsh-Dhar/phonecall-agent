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
import { buildOutboundCallSystemInstruction } from "./callAnalysis";
import { getOrCreateActiveConversation } from "./conversations";
import { createCallLifecycle } from "./callLifecycle";
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
    let lifecycle: ReturnType<typeof createCallLifecycle> | null = null;

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

            // Get the user's name and timezone (the person making the call)
            const user = await prisma.account.findUnique({
              where: { id: contact.ownerId ?? undefined },
              select: { name: true, timezone: true },
            });

            if (!user) {
              throw new Error("User account not found for contact");
            }

            const startedAt = new Date();
            const tz = user.timezone ?? process.env.DEFAULT_TIMEZONE ?? "Asia/Kolkata";
            const call = await prisma.call.create({
              data: {
                status: "in-progress",
                direction: "outbound",
                conversationId: conversation.id,
                contactId: contact.id,
                from: "browser",
                to: "browser",
                startedAt,
                taskId: taskContext ? taskId : null,
              },
            });

            lifecycle = createCallLifecycle({
              callId: call.id,
              conversationId: conversation.id,
              ownerId: contact.ownerId ?? "",
              contactId: contact.id,
              startedAt,
              send: (msg) => browserWs.send(JSON.stringify(msg)),
              closeSocket: () => browserWs.close(),
              getGemini: () => gemini,
              clearGemini: () => { gemini = null; },
            });

            const knowledgeFacts = await prisma.contactKnowledge.findMany({
              where: { contactId: contact.id, status: "active" },
              orderBy: { category: "asc" },
            });

            gemini = await openGeminiLiveSession({
              systemInstructionText: buildOutboundCallSystemInstruction(
                user.name,
                contact.name,
                knowledgeFacts,
                taskContext,
                tz
              ),
              onAudioOut: (pcm24k) => {
                lifecycle?.noteAudioOut(pcm24k);
                browserWs.send(JSON.stringify({ type: "audio", payload: pcm16ToBrowserPayload(pcm24k) }));
              },
              onUserTurnText: (text) => {
                void lifecycle?.logTurn("user", text);
                browserWs.send(JSON.stringify({ type: "transcript", role: "user", text }));
              },
              onAgentTurnText: (text) => {
                void lifecycle?.logTurn("assistant", text);
                browserWs.send(JSON.stringify({ type: "transcript", role: "assistant", text }));
              },
              onAskUser: (args) => lifecycle?.onAskUser(args),
              onEndCallRequested: (args) => lifecycle?.onEndCall(args),
              onClosed: () => lifecycle?.onGeminiClosed(),
            });

            await new Promise((resolve) => setTimeout(resolve, 500));

            browserWs.send(JSON.stringify({ type: "ready", callId: call.id, conversationId: conversation.id }));
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

          if (!msg.payload || msg.payload.length === 0) {
            return;
          }

          const pcm24k = browserPayloadToPcm16(msg.payload);
          if (pcm24k.length === 0) {
            return;
          }

          gemini.sendAudio(pcm24k);
          break;
        }

        case "stop":
          await lifecycle?.end("user");
          break;
      }
    });

    browserWs.on("close", () => {
      void lifecycle?.end("user");
    });

    browserWs.on("error", (err) => {
      logger.error({ err }, "voiceStreamBrowser: browser WebSocket error");
      void lifecycle?.end("user");
    });
  });

  return wss;
}
