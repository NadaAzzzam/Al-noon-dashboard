import { Router } from "express";
import {
  createCity,
  deleteCity,
  getCity,
  listCities,
  updateCity
} from "../controllers/citiesController.js";
import { authenticate, requirePermission } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { cityParamsSchema, citySchema, cityUpdateSchema } from "../validators/cities.js";

const router = Router();

router.get("/", listCities);
router.get("/:id", validate(cityParamsSchema), getCity);

router.use(authenticate);
router.post("/", requirePermission(["cities.manage"]), validate(citySchema), createCity);
router.put("/:id", requirePermission(["cities.manage"]), validate(cityUpdateSchema), updateCity);
router.delete("/:id", requirePermission(["cities.manage"]), validate(cityParamsSchema), deleteCity);

export default router;
