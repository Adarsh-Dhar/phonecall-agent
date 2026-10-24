import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import pushRouter from "./push";
import outboundRouter from "./outbound";
import orchestratorRouter from "./orchestrator";
import contactsRouter from "./contacts";
import conversationsRouter from "./conversations";
import historyRouter from "./history";
import tasksRouter from "./tasks";
import questionsRouter from "./questions";
import knowledgeRouter from "./knowledge";
import callsRouter from "./calls";
import calendarEventsRouter from "./calendarEvents";
import businessRouter from "./business";
import ownerInfoRouter from "./ownerInfo";
import { requireAuth } from "../lib/authMiddleware";
import { requireBusiness, requireIndividual } from "../lib/roles";

const router: IRouter = Router();

// ── Public routes ─────────────────────────────────────────────────────────
router.use(healthRouter);
router.use(authRouter);
router.use(pushRouter);
router.use(outboundRouter); // opt-out links from messages sent to businesses (signed token, no login)

// ── Protected routes (require authentication) ─────────────────────────────
router.use(requireAuth);

// ── Business routes (protected at route level, calls accessible to both) ───
router.use("/business", businessRouter);

// ── Individual-only routes (mount each with requireIndividual separately) ───
// Order matters: more specific routes first
router.use("/orchestrator", requireIndividual, orchestratorRouter);
router.use("/questions", requireIndividual, questionsRouter);
router.use("/conversations", requireIndividual, conversationsRouter);
router.use("/history", requireIndividual, historyRouter);
router.use("/tasks", requireIndividual, tasksRouter);
router.use("/knowledge", requireIndividual, knowledgeRouter);
router.use("/owner-info", requireIndividual, ownerInfoRouter);
router.use("/calls", requireIndividual, callsRouter);
router.use("/calendar/events", requireIndividual, calendarEventsRouter);
router.use("", requireIndividual, contactsRouter);

export default router;
