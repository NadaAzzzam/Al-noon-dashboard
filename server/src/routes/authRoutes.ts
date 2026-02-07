import { Router } from "express";
import { login, me, register } from "../controllers/authController.js";
import { authenticate } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { loginSchema, registerSchema } from "../validators/auth.js";

const router = Router();

router.post("/sign-up", validate(registerSchema), register);
router.post("/sign-in", validate(loginSchema), login);
router.get("/profile", authenticate, me);

export default router;
