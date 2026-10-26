import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { getRoomCount } from "../services/voiceStreamService";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

if (process.env.TEST_MODE === "true") {
  router.get("/_debug/rooms", (_req, res) => { res.json({ rooms: getRoomCount() }); });
}

export default router;
