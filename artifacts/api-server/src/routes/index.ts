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
import emailsRouter from "./emails";
import twilioVoiceRouter from "./twilioVoice";
import { verifyTwilioSignature } from "../middlewares/verifyTwilioSignature";

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

// ── Calls REST API (no signature check — called by our own frontend) ───────
router.use(callsRouter);

// ── Emails REST API (no signature check — called by our own frontend) ──────
router.use(emailsRouter);

// ── Twilio webhook routes (signature-verified) ─────────────────────────────
// verifyTwilioSignature is applied only to the /twilio/* routes, not the
// public /calls endpoint, so the frontend can trigger calls freely.
router.use(verifyTwilioSignature, twilioVoiceRouter);

export default router;
