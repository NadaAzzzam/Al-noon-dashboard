import { Router } from "express";
import { getAiSettings, postChat, listSessions, getSessionById, deleteSession } from "../controllers/aiController.js";
import { authenticate, requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { chatRequestSchema, sessionIdParamSchema, listSessionsQuerySchema } from "../validators/ai.js";

const router = Router();

/** Public: storefront widget checks if AI is enabled and gets greeting + suggested questions */
router.get("/settings", getAiSettings);
/** Public: customer sends a message and receives AI response */
router.post("/chat", validate(chatRequestSchema), postChat);

/** Admin: list chat sessions */
router.get("/sessions", authenticate, requireRole(["ADMIN"]), validate(listSessionsQuerySchema), listSessions);
/** Admin: get one session with messages */
router.get("/sessions/:id", authenticate, requireRole(["ADMIN"]), validate(sessionIdParamSchema), getSessionById);
/** Admin: delete a session */
router.delete("/sessions/:id", authenticate, requireRole(["ADMIN"]), validate(sessionIdParamSchema), deleteSession);

export default router;
