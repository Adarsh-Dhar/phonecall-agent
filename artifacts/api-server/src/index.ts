/**
 * Server entry point
 *
 * Switches from the plain `app.listen()` pattern to `http.createServer(app)`
 * so that the same port serves both:
 *   - Regular HTTP/Express routes (all /api/* endpoints)
 *   - WebSocket upgrades to /media-stream  (Twilio Media Stream bridge)
 *
 * Any WS upgrade that is NOT for /media-stream is rejected immediately so
 * we don't accidentally expose unintended socket endpoints.
 */

import http from "node:http";
import { WebSocketServer } from "ws";
import app from "./app";
import { logger } from "./lib/logger";
import { sweepStaleConversations } from "./services/taskExtraction";
import { handleMediaStream } from "./ws/mediaStream";

// ---------------------------------------------------------------------------
// Validate required env vars
// ---------------------------------------------------------------------------

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is required but was not provided."
  );
} else {
  logger.info("DATABASE_URL provided: " + process.env.DATABASE_URL);
}

// ---------------------------------------------------------------------------
// HTTP server + WebSocket upgrade handling
// ---------------------------------------------------------------------------

const server = http.createServer(app);

// A single WSS in "noServer" mode — we handle the HTTP upgrade manually so
// we can inspect the URL and route to the right handler.
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  const url = req.url ?? "";

  if (url === "/media-stream" || url.startsWith("/media-stream?")) {
    // Twilio Media Stream — hand off to the bridge
    wss.handleUpgrade(req, socket, head, (ws) => {
      handleMediaStream(ws, req);
    });
  } else {
    // Reject any other WS upgrade attempt
    logger.warn({ url }, "ws: rejecting upgrade for unknown path");
    socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    socket.destroy();
  }
});

// ---------------------------------------------------------------------------
// Start listening
// ---------------------------------------------------------------------------

server.listen(port, (err?: Error) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // On every boot, pick up any conversations that missed extraction due to
  // a restart killing their in-flight debounce timers.
  void sweepStaleConversations();
});
