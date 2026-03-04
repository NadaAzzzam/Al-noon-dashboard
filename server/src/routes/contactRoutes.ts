import { Router } from "express";
import { listContactSubmissions } from "../controllers/contactController.js";
import { authenticateAdmin, requirePermission } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { listContactQuerySchema } from "../validators/contact.js";

const router = Router();

router.get("/", authenticateAdmin, requirePermission(["contact.view"]), validate(listContactQuerySchema), listContactSubmissions);

export default router;
