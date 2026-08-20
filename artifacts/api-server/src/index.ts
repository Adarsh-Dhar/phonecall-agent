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
  const path = require('path');
  const rootPath = path.resolve(__dirname, '../../../prisma/dev.db');
  process.env.DATABASE_URL = `file:${rootPath}`;
  logger.info("DATABASE_URL not provided, using default: file:" + rootPath);
} else {
  logger.info("DATABASE_URL provided: " + process.env.DATABASE_URL);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
