import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { updateUserSettingsSchema } from "../schemas/user.schema.js";
import * as userController from "../controllers/user.controller.js";

const router = Router();

// Protect all user routes
router.use(authMiddleware);

// Get current settings
router.get("/settings", userController.getSettings);

// Update settings
router.patch(
  "/settings",
  validate(updateUserSettingsSchema),
  userController.updateSettings,
);

export default router;

