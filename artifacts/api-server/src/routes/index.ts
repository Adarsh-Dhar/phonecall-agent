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

// ── Business-only routes ──────────────────────────────────────────────────
router.use("/business", requireBusiness, businessRouter);

// ── Individual-only routes ────────────────────────────────────────────────
router.use(requireIndividual);
router.use(orchestratorRouter);
router.use(contactsRouter);
router.use(conversationsRouter);
router.use(messagesRouter);
router.use(historyRouter);
router.use(tasksRouter);
router.use(questionsRouter);
router.use(knowledgeRouter);
router.use(callsRouter);
router.use(calendarEventsRouter);

export default router;
