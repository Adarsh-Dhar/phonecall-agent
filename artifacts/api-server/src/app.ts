import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { isTestMode } from "./lib/testMode";
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
app.use(cors({
  credentials: true,
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, server-to-server)
    if (!origin) {
      callback(null, true);
      return;
    }

    // In development, allow multiple localhost ports for flexibility
    if (process.env.NODE_ENV === 'development') {
      const devOrigins = [
        process.env.FRONTEND_URL || 'http://localhost:5175',
        'http://localhost:5173', // Vite default
        'http://localhost:5174', // Alternative
        'http://localhost:5176', // Alternative
      ];
      if (devOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: development only allows ${devOrigins.join(', ')}, got ${origin}`));
      }
      return;
    }

    // In production, allow configured FRONTEND_URL(s)
    const allowed = (process.env.FRONTEND_URL || '').split(',').map(s => s.trim()).filter(Boolean);
    if (allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Mount test control routes only in test mode (S3)
if (isTestMode()) {
  // Dynamic: the module (and the fake Gemini it drives) must not load in production.
  const { testControlRouter } = await import("./routes/testControl");
  app.use("/_test", testControlRouter);
  logger.info("Test control routes mounted at /_test");
}

// Serve frontend static files only in production (not during development)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDistPath = path.join(__dirname, "../../phone-agent/dist/public");

if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  
  // Serve index.html for SPA routing (catch-all for non-API routes)
  app.use((req, res, next) => {
    if (req.path.startsWith("/api") || req.path.includes(".")) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
  
  logger.info("Frontend static files enabled");
} else if (process.env.NODE_ENV === 'development') {
  logger.info("Development mode: frontend served by Vite at http://localhost:5175");
} else {
  logger.warn("Frontend static files not found, serving API only");
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default app;
