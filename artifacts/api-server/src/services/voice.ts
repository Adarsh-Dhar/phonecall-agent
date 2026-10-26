/**
 * Attaches the voice + notifications WebSocket servers to the HTTP server's
 * "upgrade" event.
 *
 * Three paths are routed here: `/media/browser` (the in-browser test call —
 * mic in, Gemini Live audio out; in-app only by design (see callScheduler.ts header);
 * no phone numbers or carriers), `/media/service` (real calls to service accounts),
 * `/presence` (live presence registry), and `/notifications` (server → browser push,
 * used by services/callScheduler.ts to tell an open tab a task's due date has arrived).
 * Route by `req.url` here rather than having each transport register its own
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
import { attachHeartbeat } from "../lib/wsHeartbeat";

const safeUrl = (u?: string) => (u ?? "").replace(/token=[^&]+/g, "token=[redacted]");

function extractUserId(req: IncomingMessage): string | null {
  logger.info({ url: safeUrl(req.url) }, "WebSocket upgrade request received");

  // Try cookie first (both httpOnly and non-httpOnly versions)
  const cookieHeader = req.headers.cookie ?? "";
  const cookieMatch = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
  const cookieWsMatch = cookieHeader.match(/(?:^|;\s*)token_ws=([^;]+)/);

  // Try query parameter as fallback
  const urlParts = (req.url || "").split("?");
  const queryToken = urlParts.length > 1
    ? new URLSearchParams(urlParts[1]).get("token")
    : null;

  const token = cookieMatch?.[1] || cookieWsMatch?.[1] || queryToken;

  if (!token) {
    logger.warn({ url: safeUrl(req.url), hasCookie: !!cookieHeader, hasQueryParam: !!queryToken }, "WebSocket upgrade failed: no token found");
    return null;
  }

  try {
    const payload = verifyToken(decodeURIComponent(token));
    if (!payload?.userId) {
      logger.warn({ url: safeUrl(req.url), payload }, "WebSocket upgrade failed: invalid token - no userId in payload");
      return null;
    }
    const source = cookieMatch ? 'cookie' : (cookieWsMatch ? 'cookie_ws' : 'query');
    logger.info({ userId: payload.userId, url: safeUrl(req.url), source }, "WebSocket upgrade authenticated successfully");
    return payload.userId;
  } catch (error) {
    logger.error({ error, url: safeUrl(req.url) }, "WebSocket upgrade failed: token verification error");
    return null;
  }
}

export function attachVoiceStreams(server: Server) {
  const browserWss = createBrowserVoiceStream();
  const serviceWss = createServiceVoiceStream();
  const notificationsWss = createNotificationsStream();

  // Create a single presence WebSocket server to be reused for all connections
  const presenceWss = new WebSocketServer({ noServer: true, maxPayload: 256 * 1024 }); // 256KB limit (Chapter 6)

  // Increase max listeners to prevent EventEmitter warnings
  browserWss.setMaxListeners(50);
  serviceWss.setMaxListeners(50);
  notificationsWss.setMaxListeners(50);
  presenceWss.setMaxListeners(50);

  // Attach heartbeat to all WebSocket servers (S2)
  for (const w of [browserWss, serviceWss, notificationsWss, presenceWss]) attachHeartbeat(w);

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
    logger.info({ pathname, url: safeUrl(req.url) }, "WebSocket upgrade event received");

    // Authentication check for all WebSocket paths
    const userId = extractUserId(req);
    if (!userId) {
      logger.warn({ pathname }, "WebSocket upgrade rejected: authentication failed");
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }
    (req as any).userId = userId; // Hand to each stream's connection handler

    if (pathname === "/media/browser") {
      logger.info({ userId }, "Handling /media/browser WebSocket upgrade");
      browserWss.handleUpgrade(req, socket, head, (ws) => browserWss.emit("connection", ws, req));
      return;
    }

    if (pathname === "/media/service") {
      logger.info({ userId }, "Handling /media/service WebSocket upgrade");
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
      logger.info({ userId }, "Handling /notifications WebSocket upgrade");
      notificationsWss.handleUpgrade(req, socket, head, (ws) => notificationsWss.emit("connection", ws, req));
      return;
    }

    // Unknown WebSocket path
    logger.warn({ pathname }, "voice: rejected upgrade request for unknown path");
    socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    socket.destroy();
  });
}
