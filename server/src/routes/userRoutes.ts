import { Router } from "express";
import { listUsers, updateUserRole } from "../controllers/usersController.js";
import { authenticate, requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { updateRoleSchema } from "../validators/users.js";

const router = Router();

router.use(authenticate, requireRole(["ADMIN"]));

router.get("/", listUsers);
router.patch("/:id/role", validate(updateRoleSchema), updateUserRole);

export default router;
