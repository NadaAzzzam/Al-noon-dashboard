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
import { authenticate, requireRole } from "../middlewares/auth.js";
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

router.use(authenticate, requireRole(["ADMIN"]));

router.get("/", validate(listFeedbackQuerySchema), listFeedback);
router.post("/upload-image", multerUploadFeedbackImage, uploadFeedbackImage);
router.post("/", validate(createFeedbackSchema), createFeedback);
router.get("/:id", validate(feedbackIdParamSchema), getFeedback);
router.put("/:id", validate(updateFeedbackSchema), updateFeedback);
router.delete("/:id", validate(feedbackIdParamSchema), deleteFeedback);
router.patch("/:id/approve", validate(approveFeedbackSchema), setFeedbackApproved);

export default router;
