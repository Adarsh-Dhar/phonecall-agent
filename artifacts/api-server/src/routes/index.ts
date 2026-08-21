import { Router, type IRouter } from "express";
import healthRouter from "./health";
import geminiRouter from "./gemini";
import contactsRouter from "./contacts";
import conversationsRouter from "./conversations";
import messagesRouter from "./messages";
import historyRouter from "./history";
import tasksRouter from "./tasks";
import queriesRouter from "./queries";

const router: IRouter = Router();

router.use(healthRouter);
router.use(geminiRouter);
router.use(contactsRouter);
router.use(conversationsRouter);
router.use(messagesRouter);
router.use(historyRouter);
router.use(tasksRouter);
router.use(queriesRouter);

export default router;
