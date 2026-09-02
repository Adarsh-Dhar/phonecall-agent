import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { prisma } from "@workspace/db-prisma";
import { exotelPayloadToPcm16, pcm16ToExotelPayload } from "../lib/audioCodec";
import { openGeminiLiveSession, type GeminiVoiceSession } from "./geminiVoiceSession";
import { scheduleExtraction } from "./taskExtraction";
import { buildCallSystemInstruction } from "./callAnalysis";
import { logger } from "../lib/logger";

export function attachVoiceStream(server: Server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    if (req.url?.startsWith("/media")) {
      wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
    } else {
      socket.destroy();
    }
  });

  wss.on("connection", (exotelWs: WebSocket) => {
    let gemini: GeminiVoiceSession | null = null;
    let streamSid = "";
    let callRowId: string | null = null;
    let conversationId: string | null = null;

    exotelWs.on("message", async (raw) => {
      let msg: any;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      switch (msg.event) {
        case "connected":
          break;

        case "start": {
          streamSid = msg.stream_sid;
          const callSid: string | undefined = msg.start?.call_sid;
          const from: string | undefined = msg.start?.from;
          const to: string | undefined = msg.start?.to;

          const callRow = callSid
            ? await prisma.call.findUnique({ where: { exotelCallSid: callSid } })
            : null;

          if (callRow) {
            callRowId = callRow.id;
            conversationId = callRow.conversationId;
            await prisma.call.update({
              where: { id: callRow.id },
              data: { streamSid, status: "in-progress", startedAt: new Date() },
            });
          } else {
            logger.warn({ callSid }, "voiceStream: no matching Call row for inbound stream — likely an inbound call from an unknown number, not yet handled");
          }

          const contact = callRow
            ? await prisma.contact.findUnique({ where: { id: callRow.contactId } })
            : null;

          gemini = await openGeminiLiveSession({
            systemInstructionText: buildCallSystemInstruction(contact?.name ?? "the caller"),
            onAudioOut: (pcm24k) => {
              exotelWs.send(
                JSON.stringify({
                  event: "media",
                  stream_sid: streamSid,
                  media: { payload: pcm16ToExotelPayload(pcm24k) },
                })
              );
            },
            onUserTurnText: (text) => void logTurn("user", text),
            onAgentTurnText: (text) => void logTurn("assistant", text),
          });
          break;
        }

        case "media": {
          if (!gemini) return;
          const pcm24k = exotelPayloadToPcm16(msg.media.payload);
          gemini.sendAudio(pcm24k);
          break;
        }

        case "dtmf":
          break;

        case "stop":
          gemini?.close();
          gemini = null;
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
          callId: callRowId,
        },
      });
      scheduleExtraction(conversationId);
    }

    exotelWs.on("close", () => {
      gemini?.close();
      gemini = null;
    });
  });
}