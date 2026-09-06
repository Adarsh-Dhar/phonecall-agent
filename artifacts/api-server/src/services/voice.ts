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
  if (!match) {
    logger.warn({ url: req.url, hasCookie: !!cookieHeader }, "WebSocket upgrade failed: no token cookie found");
    return null;
  }
  const payload = verifyToken(decodeURIComponent(match[1]));
  if (!payload?.userId) {
    logger.warn({ url: req.url }, "WebSocket upgrade failed: invalid token");
    return null;
  }
  logger.info({ userId: payload.userId, url: req.url }, "WebSocket upgrade authenticated successfully");
  return payload.userId;
}

export function attachVoiceStreams(server: Server) {
  const browserWss = createBrowserVoiceStream();
  const serviceWss = createServiceVoiceStream();
  const notificationsWss = createNotificationsStream();
  
  // Create a single presence WebSocket server to be reused for all connections
  const presenceWss = new WebSocketServer({ noServer: true });

  // Handle presence connections
  presenceWss.on("connection", (ws: WebSocket, req: any) => {
    logger.info("Presence WebSocket connection established");
    const userId = req.userId;
    if (!userId) {
      logger.warn("Presence connection without userId");
      ws.close();
      return;
    }
    
    logger.info({ userId }, "Calling registerPresence");
    registerPresence(userId, ws);
    
    ws.on("close", () => {
      logger.info({ userId }, "Presence WebSocket closed");
      unregisterPresence(userId, ws);
    });
    
    ws.on("error", (error) => {
      logger.error({ userId, error }, "Presence WebSocket error");
      unregisterPresence(userId, ws);
    });
  });

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
      // Presence registry - use the reusable WebSocket server
      logger.info({ userId }, "Handling /presence WebSocket upgrade");
      presenceWss.handleUpgrade(req, socket, head, (ws) => {
        logger.info({ userId }, "Presence WebSocket upgrade complete, emitting connection event");
        presenceWss.emit("connection", ws, req);
      });
      return;
    }

    if (pathname === "/notifications") {
      notificationsWss.handleUpgrade(req, socket, head, (ws) => notificationsWss.emit("connection", ws, req));
      return;
    }

    // Unknown WebSocket path
    logger.warn({ pathname }, "voice: rejected upgrade request for unknown path");
    socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    socket.destroy();
  });
}
