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
import emailsRouter from "./emails";

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

// ── Emails REST API (no signature check — called by our own frontend) ──────
router.use(emailsRouter);

export default router;
