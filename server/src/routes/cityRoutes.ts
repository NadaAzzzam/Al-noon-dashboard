import { Router } from "express";
import {
  createCity,
  deleteCity,
  getCity,
  listCities,
  updateCity
} from "../controllers/citiesController.js";
import { authenticate, requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { cityParamsSchema, citySchema, cityUpdateSchema } from "../validators/cities.js";

const router = Router();

router.get("/", listCities);
router.get("/:id", validate(cityParamsSchema), getCity);

router.use(authenticate, requireRole(["ADMIN"]));
router.post("/", validate(citySchema), createCity);
router.put("/:id", validate(cityUpdateSchema), updateCity);
router.delete("/:id", validate(cityParamsSchema), deleteCity);

export default router;
