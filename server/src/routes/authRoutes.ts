import { Router } from "express";
import { login, me, register, signOut } from "../controllers/authController.js";
import { authenticateAny } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { loginSchema, registerSchema } from "../validators/auth.js";

const router = Router();

router.post("/sign-up", validate(registerSchema), register);
router.post("/sign-in", validate(loginSchema), login);
router.get("/profile", authenticateAny, me);
router.post("/sign-out", authenticateAny, signOut);

export default router;
