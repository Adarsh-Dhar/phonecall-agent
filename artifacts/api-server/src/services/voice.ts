/**
 * Attaches the voice WebSocket server to the HTTP server's "upgrade" event.
 *
 * Only one transport exists now: the in-browser test call at `/media/browser` 
 * (mic in, Gemini Live audio out — no telephony carrier involved). If you
 * ever add another transport, route by `req.url` here rather than having
 * each transport register its own `server.on("upgrade", ...)` listener —
 * every listener sees every upgrade request, so uncoordinated listeners can
 * steal or destroy each other's connections.
 */

import type { Server } from "http";
import { createBrowserVoiceStream } from "./voiceStreamBrowser";
import { logger } from "../lib/logger";

export function attachVoiceStreams(server: Server) {
  const browserWss = createBrowserVoiceStream();

  server.on("upgrade", (req, socket, head) => {
    const pathname = req.url?.split("?")[0];

    if (pathname === "/media/browser") {
      browserWss.handleUpgrade(req, socket, head, (ws) => browserWss.emit("connection", ws, req));
      return;
    }

    logger.warn({ pathname }, "voice: rejected upgrade request for unknown path");
    socket.destroy();
  });
}