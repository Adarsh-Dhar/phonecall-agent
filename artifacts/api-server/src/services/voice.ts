/**
 * Attaches the voice + notifications WebSocket servers to the HTTP server's
 * "upgrade" event.
 *
 * Three paths are routed here: `/media/browser` (the in-browser test call —
 * mic in, Gemini Live audio out, no telephony carrier involved), `/media/service`
 * (real calls to service accounts), `/presence` (live presence registry), and
 * `/notifications` (server → browser push, used by services/callScheduler.ts
 * to tell an open tab a task's due date has arrived). Route by `req.url`
 * here rather than having each transport register its own
 * `server.on("upgrade", ...)` listener — every listener sees every upgrade
 * request, so uncoordinated listeners can steal or destroy each other's
 * connections.
 */

import type { Server } from "http";
import type { IncomingMessage } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createBrowserVoiceStream } from "./voiceStreamBrowser";
import { createServiceVoiceStream } from "./voiceStreamService";
import { createNotificationsStream } from "./notifications";
import { registerPresence, unregisterPresence } from "./presence";
import { logger } from "../lib/logger";
import { verifyToken } from "../lib/jwt";

function extractUserId(req: IncomingMessage): string | null {
  const cookieHeader = req.headers.cookie ?? "";
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
  if (!match) return null;
  const payload = verifyToken(decodeURIComponent(match[1]));
  return payload?.userId ?? null;
}

export function attachVoiceStreams(server: Server) {
  const browserWss = createBrowserVoiceStream();
  const serviceWss = createServiceVoiceStream();
  const notificationsWss = createNotificationsStream();

  server.on("upgrade", (req, socket, head) => {
    const pathname = req.url?.split("?")[0];

    // Authentication check for all WebSocket paths
    const userId = extractUserId(req);
    if (!userId) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }
    (req as any).userId = userId; // Hand to each stream's connection handler

    if (pathname === "/media/browser") {
      browserWss.handleUpgrade(req, socket, head, (ws) => browserWss.emit("connection", ws, req));
      return;
    }

    if (pathname === "/media/service") {
      serviceWss.handleUpgrade(req, socket, head, (ws) => serviceWss.emit("connection", ws, req));
      return;
    }

    if (pathname === "/presence") {
      // Presence registry - use a simple WebSocket upgrade
      // Create a minimal WebSocket server for presence
      const presenceWss = new WebSocketServer({ noServer: true });
      presenceWss.handleUpgrade(req, socket, head, (ws) => {
        presenceWss.emit("connection", ws, req);
      });
      
      presenceWss.on("connection", (ws: WebSocket) => {
        registerPresence(userId, ws);
        
        ws.on("close", () => {
          unregisterPresence(userId, ws);
        });
        
        ws.on("error", () => {
          unregisterPresence(userId, ws);
        });
      });
      
      return;
    }

    if (pathname === "/notifications") {
      notificationsWss.handleUpgrade(req, socket, head, (ws) => notificationsWss.emit("connection", ws, req));
      return;
    }

    logger.warn({ pathname }, "voice: rejected upgrade request for unknown path");
    socket.destroy();
  });
}
