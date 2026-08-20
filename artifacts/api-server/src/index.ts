import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Set DATABASE_URL if not provided
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
} else {
  // If DATABASE_URL is provided, make sure it's an absolute path
  if (process.env.DATABASE_URL.startsWith('file:.')) {
    const path = require('path');
    const absolutePath = path.resolve(process.env.DATABASE_URL.replace('file:', ''));
    process.env.DATABASE_URL = `file:${absolutePath}`;
  }
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
