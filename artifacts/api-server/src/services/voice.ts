/**
 * Attaches the voice + notifications WebSocket servers to the HTTP server's
 * "upgrade" event.
 *
 * Two paths are routed here: `/media/browser` (the in-browser test call —
 * mic in, Gemini Live audio out, no telephony carrier involved) and
 * `/notifications` (server → browser push, used by services/callScheduler.ts
 * to tell an open tab a task's due date has arrived). Route by `req.url`
 * here rather than having each transport register its own
 * `server.on("upgrade", ...)` listener — every listener sees every upgrade
 * request, so uncoordinated listeners can steal or destroy each other's
 * connections.
 */

import type { Server } from "http";
import { createBrowserVoiceStream } from "./voiceStreamBrowser";
import { createNotificationsStream } from "./notifications";
import { logger } from "../lib/logger";

export function attachVoiceStreams(server: Server) {
  const browserWss = createBrowserVoiceStream();
  const notificationsWss = createNotificationsStream();

  server.on("upgrade", (req, socket, head) => {
    const pathname = req.url?.split("?")[0];

    if (pathname === "/media/browser") {
      browserWss.handleUpgrade(req, socket, head, (ws) => browserWss.emit("connection", ws, req));
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
