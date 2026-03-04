import { Router } from "express";
import { login, me, register, signOut, forgotPassword, resetPassword, changePassword } from "../controllers/authController.js";
import { authenticate, authenticateAny } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema } from "../validators/auth.js";

const router = Router();

router.post("/sign-up", validate(registerSchema), register);
router.post("/sign-in", validate(loginSchema), login);
router.get("/profile", authenticateAny, me);
router.post("/sign-out", authenticateAny, signOut);

router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);
router.post("/change-password", authenticate, validate(changePasswordSchema), changePassword);

export default router;
