import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { getNebiusStats, resetNebiusStats } from "../services/nebiusText";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

// Model-client health: which model answered, latency, tokens, retries and
// fallbackCount (should stay 0 when NEBIUS_MODEL is valid). Counters only — no secrets.
router.get("/healthz/nebius", (_req, res) => {
  res.json(getNebiusStats());
});

// Reset stats for clean test runs (dev only)
if (process.env.NODE_ENV !== "production") {
  router.post("/healthz/nebius/reset", (_req, res) => {
    resetNebiusStats();
    res.json({ ok: true });
  });
}

export default router;
