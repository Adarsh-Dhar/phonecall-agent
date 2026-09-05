import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import geminiRouter from "./gemini";
import contactsRouter from "./contacts";
import conversationsRouter from "./conversations";
import messagesRouter from "./messages";
import historyRouter from "./history";
import tasksRouter from "./tasks";
import questionsRouter from "./questions";
import knowledgeRouter from "./knowledge";
import callsRouter from "./calls";
import calendarEventsRouter from "./calendarEvents";
import { requireAuth } from "../lib/authMiddleware";

const router: IRouter = Router();

// ── Public routes ─────────────────────────────────────────────────────────
router.use(healthRouter);
router.use(authRouter);

// ── Protected routes (require authentication) ─────────────────────────────
router.use(requireAuth);
router.use(geminiRouter);
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
