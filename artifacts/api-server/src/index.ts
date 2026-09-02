/**
 * Server entry point
 */

import app from "./app";
import { logger } from "./lib/logger";
import { sweepStaleConversations } from "./services/taskExtraction";
import { attachVoiceStream } from "./services/voiceStream";
import type { Server } from "http";

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
// Start listening
// ---------------------------------------------------------------------------

const server = app.listen(port, () => {
  logger.info({ port }, "Server listening");

  // On every boot, pick up any conversations that missed extraction due to
  // a restart killing their in-flight debounce timers.
  void sweepStaleConversations();
}) as Server;

attachVoiceStream(server);
