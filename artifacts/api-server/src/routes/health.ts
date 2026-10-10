import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { getNebiusConfig, getNebiusModelStatus } from "../services/nebiusText";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

// Surfaces silent model fallbacks (a misconfigured NEBIUS_MODEL otherwise looks
// like "everything works"). Model names and counters only — no keys, no content.
router.get("/healthz/nebius", (_req, res) => {
  const { model, fallbackModel } = getNebiusConfig();
  const status = getNebiusModelStatus();
  res.json({
    configuredModel: model,
    fallbackModel: fallbackModel || null,
    healthy: status.fallbackCount === 0,
    ...status,
  });
});

export default router;
