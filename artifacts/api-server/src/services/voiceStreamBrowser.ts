/**
 * Browser test-call transport — the only voice transport in this app.
 *
 * A plain WebSocket from a browser mic feeds the Gemini Live pipeline
 * (STT+LLM+TTS in one streaming session) and plays the response back through
 * the Web Audio API. No telephony carrier, no phone number, no per-minute
 * cost — every "call" happens over your own network connection.
 *
 * Wire protocol (JSON messages over the WebSocket):
 *   → { type: "start", contactId?: string }                  browser → server
 *   → { type: "audio", payload: "<base64 pcm16 16kHz>" }      browser → server
 *   → { type: "stop" }                                        browser → server
 *   ← { type: "ready", callId, conversationId }                server → browser
 *   ← { type: "audio", payload: "<base64 pcm16 24kHz>" }       server → browser
 *   ← { type: "transcript", role: "user"|"assistant", text }   server → browser
 *   ← { type: "error", message }                               server → browser
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
// a real phone number. Created lazily on first use.
const TEST_CONTACT_NAME = "Browser Test";

async function getOrCreateTestContact() {
  let contact = await prisma.contact.findFirst({ where: { name: TEST_CONTACT_NAME } });
  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        name: TEST_CONTACT_NAME,
        business: "Local dev / browser test",
        category: "Other",
        phone: "browser-test",
        initials: "BT",
        color: "#6366f1",
        note: "Auto-created contact for free, in-browser microphone test calls (no telephony involved).",
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
            const contact = contactId
              ? await prisma.contact.findUnique({ where: { id: contactId } })
              : await getOrCreateTestContact();

            if (!contact) {
              browserWs.send(JSON.stringify({ type: "error", message: "Contact not found" }));
              return;
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
                status: "in-progress",
                direction: "outbound",
                conversationId: conversation.id,
                contactId: contact.id,
                from: "browser",
                to: "browser",
                startedAt,
              },
            });
            callId = call.id;

            gemini = await openGeminiLiveSession({
              systemInstructionText: buildCallSystemInstruction(contact.name),
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
            });

            // Wait a moment for the session to stabilize
            await new Promise(resolve => setTimeout(resolve, 500));

            browserWs.send(JSON.stringify({ type: "ready", callId, conversationId }));
          } catch (err) {
            logger.error({ err }, "voiceStreamBrowser: failed to start session");
            browserWs.send(
              JSON.stringify({
                type: "error",
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
            payloadStart: msg.payload.substring(0, 100),
            payloadEnd: msg.payload.substring(msg.payload.length - 100)
          }, "voiceStreamBrowser: received audio payload");
          
          const pcm24k = browserPayloadToPcm16(msg.payload);
          logger.info({ 
            pcm24kLength: pcm24k.length,
            sampleValues: Array.from(pcm24k.slice(0, 10)),
            maxAmplitude: Math.max(...Array.from(pcm24k.map(Math.abs)))
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

    async function logTurn(role: "user" | "assistant", content: string) {
      if (!conversationId) return;
      await prisma.message.create({
        data: {
          role,
          content,
          time: "Now",
          conversationId,
          callId,
        },
      });
      scheduleExtraction(conversationId);
    }

    async function endCall() {
      const currentCallId = callId; // Capture current callId before clearing
      const currentStartedAt = startedAt; // Capture current startedAt before clearing
      
      gemini?.close();
      gemini = null;

      if (currentCallId && currentStartedAt) {
        const endedAt = new Date();
        await prisma.call.update({
          where: { id: currentCallId },
          data: {
            status: "completed",
            endedAt,
            durationSec: Math.round((endedAt.getTime() - currentStartedAt.getTime()) / 1000),
            disconnectedBy: "user",
          },
        });
        void analyzeCallForEscalation(currentCallId).catch((err) =>
          logger.error({ err, callId: currentCallId }, "voiceStreamBrowser: post-call analysis failed")
        );
      }

      callId = null;
      conversationId = null;
      startedAt = null;
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