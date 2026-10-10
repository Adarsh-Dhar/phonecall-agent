import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import pushRouter from "./push";
import orchestratorRouter from "./orchestrator";
import contactsRouter from "./contacts";
import conversationsRouter from "./conversations";
import messagesRouter from "./messages";
import historyRouter from "./history";
import tasksRouter from "./tasks";
import questionsRouter from "./questions";
import knowledgeRouter from "./knowledge";
import callsRouter from "./calls";
import calendarEventsRouter from "./calendarEvents";
import businessRouter from "./business";
import { requireAuth } from "../lib/authMiddleware";
import { requireBusiness, requireIndividual } from "../lib/roles";

const router: IRouter = Router();

// ── Public routes ─────────────────────────────────────────────────────────
router.use(healthRouter);
router.use(authRouter);
router.use(pushRouter);

// ── Protected routes (require authentication) ─────────────────────────────
router.use(requireAuth);

// ── Business routes (protected at route level, calls accessible to both) ───
router.use("/business", businessRouter);

// ── Individual-only routes (mount each with requireIndividual separately) ───
router.use("/orchestrator", requireIndividual, orchestratorRouter);
router.use("", requireIndividual, contactsRouter);
router.use("/conversations", requireIndividual, conversationsRouter);
router.use("/messages", requireIndividual, messagesRouter);
router.use("/history", requireIndividual, historyRouter);
router.use("/tasks", requireIndividual, tasksRouter);
router.use("/questions", requireIndividual, questionsRouter);
router.use("/knowledge", requireIndividual, knowledgeRouter);
router.use("/calls", requireIndividual, callsRouter);
router.use("/calendarEvents", requireIndividual, calendarEventsRouter);

export default router;
