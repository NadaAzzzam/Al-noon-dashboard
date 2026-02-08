import { Router } from "express";
import { listContactSubmissions } from "../controllers/contactController.js";
import { authenticate, requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { listContactQuerySchema } from "../validators/contact.js";

const router = Router();

router.get("/", authenticate, requireRole(["ADMIN"]), validate(listContactQuerySchema), listContactSubmissions);

export default router;
