import { Router } from "express";
import {
  listFeedback,
  getFeedback,
  createFeedback,
  updateFeedback,
  deleteFeedback,
  setFeedbackApproved,
  uploadFeedbackImage
} from "../controllers/feedbackController.js";
import { authenticate, requirePermission } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import {
  createFeedbackSchema,
  updateFeedbackSchema,
  feedbackIdParamSchema,
  listFeedbackQuerySchema,
  approveFeedbackSchema
} from "../validators/feedback.js";
import { uploadFeedbackImage as multerUploadFeedbackImage } from "../middlewares/upload.js";

const router = Router();

router.use(authenticate);

router.get("/", requirePermission(["feedback.view"]), validate(listFeedbackQuerySchema), listFeedback);
router.post("/upload-image", requirePermission(["feedback.manage"]), multerUploadFeedbackImage, uploadFeedbackImage);
router.post("/", requirePermission(["feedback.manage"]), validate(createFeedbackSchema), createFeedback);
router.get("/:id", requirePermission(["feedback.view"]), validate(feedbackIdParamSchema), getFeedback);
router.put("/:id", requirePermission(["feedback.manage"]), validate(updateFeedbackSchema), updateFeedback);
router.delete("/:id", requirePermission(["feedback.manage"]), validate(feedbackIdParamSchema), deleteFeedback);
router.patch("/:id/approve", requirePermission(["feedback.manage"]), validate(approveFeedbackSchema), setFeedbackApproved);

export default router;
