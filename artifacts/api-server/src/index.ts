/**
 * Server entry point
 */

import 'dotenv/config';
import app from "./app";
import { logger } from "./lib/logger";
import { sweepStaleConversations } from "./services/taskExtraction";
import { attachVoiceStreams } from "./services/voice";
import { startCalendarSync } from "./services/calendarSync";
import { startCallScheduler } from "./services/callScheduler";
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
}

// Validate JWT_SECRET at startup (not lazy-loaded)
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'development' ? 'dev-only-jwt-secret-do-not-use-in-production' : null);
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required in production');
}

// ---------------------------------------------------------------------------
// Start listening
// ---------------------------------------------------------------------------

const server = app.listen(port, () => {
  logger.info({ port }, "Server listening");

  // On every boot, pick up any conversations that missed extraction due to
  // a restart killing their in-flight debounce timers.
  void sweepStaleConversations();

  // Start Google Calendar sync polling
  startCalendarSync();

  // Start the call-due scheduler ("agent") — watches task due dates and
  // notifies connected browser tabs when it's time to call a contact.
  startCallScheduler();
}) as Server;

attachVoiceStreams(server);
