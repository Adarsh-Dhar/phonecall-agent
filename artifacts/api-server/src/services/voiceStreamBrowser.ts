/**
 * Browser test-call transport — the only voice transport in this app.
 *
 * A plain WebSocket from a browser mic feeds the Gemini Live pipeline
 * (STT+LLM+TTS in one streaming session) and plays the response back through
 * the Web Audio API. In-app only by design (see callScheduler.ts header);
 * no phone numbers or carriers — every "call" happens over your own network connection.
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
import type { IncomingMessage } from "http";
import { prisma } from "@workspace/db-prisma";
import { browserPayloadToPcm16, pcm16ToBrowserPayload } from "../lib/audioCodec";
import { openGeminiLiveSession, type GeminiVoiceSession } from "./geminiVoiceSession";
import { buildAgentCallSystemInstruction } from "./callAnalysis";
import { getOrCreateActiveConversation } from "./conversations";
import { createCallLifecycle } from "./callLifecycle";
import { logger } from "../lib/logger";
import { loadOwnerInfo } from "./ownerInfo";
import { buildBriefing, renderMemoryBlock } from "./memory";

// A fixed synthetic contact that all browser test calls are logged against,
// so they show up in the normal Contact/Conversation/Task UI without needing
// a real phone number. Created lazily on first use, scoped to the login account
// that initiates the call (via userId in the "start" message).
const TEST_CONTACT_NAME = "Browser Test";
const MAX_CALLS_PER_INTERVAL = 5;
const CALL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

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

async function checkCallRateLimit(ownerId: string, contactId: string): Promise<{ allowed: boolean; reason?: string }> {
  const now = new Date();
  const intervalStart = new Date(now.getTime() - CALL_INTERVAL_MS);

  const recentCallCount = await prisma.call.count({
    where: {
      individualId: ownerId,
      contactId: contactId,
      createdAt: { gte: intervalStart },
    },
  });

  if (recentCallCount >= MAX_CALLS_PER_INTERVAL) {
    return {
      allowed: false,
      reason: `Rate limit exceeded: maximum ${MAX_CALLS_PER_INTERVAL} calls per ${CALL_INTERVAL_MS / 60000} minutes. Please wait before making another call.`,
    };
  }

  return { allowed: true };
}

export function createBrowserVoiceStream(): WebSocketServer {
  const wss = new WebSocketServer({
    noServer: true,
    maxPayload: 256 * 1024, // 256KB limit (Chapter 6)
  });

  wss.on("connection", (browserWs: WebSocket, req: IncomingMessage) => {
    logger.info("Browser voice WebSocket connection received");
    // Authentication is already handled in voice.ts upgrade handler
    // If we reach here, userId is guaranteed to be set
    const authUserId = (req as any).userId;
    if (!authUserId) {
      // This should never happen due to auth check in voice.ts, but if it does,
      // send an error message before closing to help debugging
      logger.error("Browser voice connection without authenticated userId - this should not happen");
      browserWs.send(JSON.stringify({ type: "error", message: "Authentication failed" }));
      browserWs.close();
      return;
    }
    logger.info({ authUserId }, "Browser voice WebSocket connection authenticated");

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

            let contact;

            if (contactId) {
              // Specific contact requested — verify ownership
              contact = await prisma.account.findFirst({
                where: { id: contactId, isService: true, ownerId: authUserId },
              });
              if (!contact) {
                browserWs.send(JSON.stringify({ type: "error", message: "Contact not found or not owned by you" }));
                browserWs.close();
                return;
              }
            } else {
              // No specific contact — use / create the Browser Test service account for the authenticated user
              contact = await getOrCreateTestContact(authUserId);
            }

            // If this call was triggered from a specific task (e.g. "Call"
            // on a calendar event), pull its title/description in so the
            // agent opens the call already knowing what it's calling about.
            let taskContext: {
              title: string;
              description: string | null;
              kind: string;
              dueDate: Date | null;
              meta: Record<string, unknown> | null;
              parentTaskId: string | null;
              appointment?: { title: string; dueDate: Date | null; ref?: string } | null;
            } | null = null;
            if (taskId) {
              const task = await prisma.task.findUnique({
                where: { id: taskId },
                select: { title: true, description: true, kind: true, dueDate: true, meta: true, parentTaskId: true, contactId: true },
              });
              if (task && task.contactId === contact.id) {
                let appointment = null;
                if (task.parentTaskId) {
                  const parent = await prisma.task.findUnique({
                    where: { id: task.parentTaskId },
                    select: { title: true, dueDate: true, meta: true, kind: true },
                  });
                  if (parent && parent.kind === 'appointment') {
                    appointment = {
                      title: parent.title,
                      dueDate: parent.dueDate,
                      ref: typeof parent.meta === 'object' && parent.meta?.ref ? String(parent.meta.ref) : undefined,
                    };
                  }
                }
                taskContext = {
                  title: task.title,
                  description: task.description,
                  kind: task.kind,
                  dueDate: task.dueDate,
                  meta: task.meta,
                  parentTaskId: task.parentTaskId,
                  appointment,
                };
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
              contact.name || ''
            );

            // Get the user's name and timezone (the person making the call)
            const user = await prisma.account.findUnique({
              where: { id: contact.ownerId ?? undefined },
              select: { id: true, name: true, timezone: true, isService: true, quietHoursStart: true, quietHoursEnd: true, responseConcise: true, askClarifying: true, confirmBeforeAction: true },
            });

            if (!user) {
              throw new Error("User account not found for contact");
            }

            // Browser test calls are only available to individual accounts
            if (user.isService) {
              throw new Error("Browser test calls are only available to individual accounts");
            }

            // Check if within individual's quiet hours
            const now = new Date();
            if (user.quietHoursStart !== null && user.quietHoursEnd !== null) {
              const localParts = new Intl.DateTimeFormat('en-US', {
                timeZone: user.timezone ?? process.env.DEFAULT_TIMEZONE ?? "Asia/Kolkata",
                hour: 'numeric',
                hourCycle: 'h23',
              }).formatToParts(now);
              const hour = Number(localParts.find((p) => p.type === 'hour')?.value ?? '0');
              // Check if hour is in quiet hours range (handles wrap-around like 22-6)
              const inRange = (h: number, start: number, end: number) => {
                if (start <= end) return h >= start && h < end;
                return h >= start || h < end;
              };
              if (inRange(hour, user.quietHoursStart, user.quietHoursEnd)) {
                throw new Error("Cannot make test calls during quiet hours");
              }
            }

            // Check rate limit: max 5 calls per 5 minutes
            const rateLimitCheck = await checkCallRateLimit(contact.ownerId ?? "", contact.id);
            if (!rateLimitCheck.allowed) {
              throw new Error(rateLimitCheck.reason || "Rate limit exceeded");
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
                individualId: contact.ownerId,
                // the business account this contact is linked to (null for an unlinked contact)
                businessId: contact.linkedAccountId ?? null,
                initiatedBy: "individual",
              },
            });

            lifecycle = createCallLifecycle({
              callId: call.id,
              conversationId: conversation.id,
              ownerId: contact.ownerId ?? "",
              contactId: contact.id,
              startedAt,
              confirmBeforeAction: user.confirmBeforeAction,
              send: (msg) => browserWs.send(JSON.stringify(msg)),
              closeSocket: () => browserWs.close(),
              getGemini: () => gemini,
              clearGemini: () => { gemini = null; },
            });

            const knowledgeFacts = await prisma.contactKnowledge.findMany({
              where: { contactId: contact.id, status: "active" },
              orderBy: { category: "asc" },
            });

            const ownerInfo = await loadOwnerInfo(user.id);

            // Memory of earlier calls. Needs a linked business account; otherwise (or on any
            // error) the call simply starts without history.
            let memoryBlock = "";
            try {
              const briefing = await buildBriefing(call.id);
              // Check if briefing has required individual data before rendering
              if (briefing.individual && briefing.individual.name) {
                memoryBlock = renderMemoryBlock(briefing, { timezone: tz });
                await prisma.call.update({
                  where: { id: call.id },
                  data: { briefingVersion: briefing.version, briefingSnapshot: briefing as any },
                });
              } else {
                logger.warn({ callId: call.id }, "voiceStreamBrowser: briefing missing individual data, skipping memory");
              }
            } catch (err) {
              logger.warn({ err, callId: call.id }, "voiceStreamBrowser: no memory briefing, starting without history");
            }

            gemini = await openGeminiLiveSession({
              callId: call.id,
              systemInstructionText: buildAgentCallSystemInstruction({
                individualName: user.name || '',
                businessName: contact.name || '',
                direction: "outbound",
                knowledgeFacts,
                taskContext,
                timezone: tz,
                ownerInfo,
                memoryBlock,
                responseConcise: user.responseConcise,
                askClarifying: user.askClarifying,
                confirmBeforeAction: user.confirmBeforeAction,
              }),
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
              onAskUser: (args) => lifecycle?.onAskUser(args) ?? Promise.resolve('USER_UNAVAILABLE'),
              onToolCall: (name, args) => lifecycle?.onToolCall(name, args) ?? Promise.resolve({ error: 'calendar_unavailable' }),
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
