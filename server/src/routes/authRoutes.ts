import { Router } from "express";
import { login, logout, me, refresh, register } from "../controllers/authController.js";
import { authenticate } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { loginSchema, refreshSchema, registerSchema } from "../validators/auth.js";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", validate(refreshSchema), refresh);
router.get("/me", authenticate, me);
router.post("/logout", authenticate, logout);

export default router;
