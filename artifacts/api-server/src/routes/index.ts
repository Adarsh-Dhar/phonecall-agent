import { Router, type IRouter } from "express";
import healthRouter from "./health";
import geminiRouter from "./gemini";
import contactsRouter from "./contacts";
import conversationsRouter from "./conversations";
import messagesRouter from "./messages";
import historyRouter from "./history";
import tasksRouter from "./tasks";
import questionsRouter from "./questions";
import knowledgeRouter from "./knowledge";
import callsRouter from "./calls";
import googleAuthRouter from "./googleAuth";

const router: IRouter = Router();

// ── Standard API routes ────────────────────────────────────────────────────
router.use(healthRouter);
router.use(geminiRouter);
router.use(contactsRouter);
router.use(conversationsRouter);
router.use(messagesRouter);
router.use(historyRouter);
router.use(tasksRouter);
router.use(questionsRouter);
router.use(knowledgeRouter);

// ── Calls REST API ──────────────────────────────────────────────────────────
router.use(callsRouter);

// ── Google Calendar OAuth ─────────────────────────────────────────────────
router.use(googleAuthRouter);

export default router;
