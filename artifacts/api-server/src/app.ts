import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Serve frontend static files if they exist (graceful fallback)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDistPath = path.join(__dirname, "../../phone-agent/dist/public");

if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  
  // Serve index.html for SPA routing (catch-all for non-API routes)
  app.use((req, res, next) => {
    // Skip API routes and static files
    if (req.path.startsWith("/api") || req.path.includes(".")) {
      return next();
    }
    // Serve index.html for all other routes (SPA routing)
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
  
  logger.info("Frontend static files enabled");
} else {
  logger.warn("Frontend static files not found, serving API only");
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default app;
