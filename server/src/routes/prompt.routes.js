import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
  createPromptSchema,
  updatePromptSchema,
  promptIdParamSchema,
  usePromptSchema,
} from "../schemas/prompt.schema.js";
import * as promptController from "../controllers/prompt.controller.js";

const router = Router();

// Protect all prompt routes
router.use(authMiddleware);

// Prompt list and create
router.get("/", promptController.listPrompts);
router.post("/", validate(createPromptSchema), promptController.createPrompt);

// Individual prompt operations
router.get("/:id", validate(promptIdParamSchema), promptController.getPrompt);
router.patch(
  "/:id",
  validate(updatePromptSchema),
  promptController.updatePrompt,
);
router.delete(
  "/:id",
  validate(promptIdParamSchema),
  promptController.deletePrompt,
);

// Variable interpolation & usage telemetry
router.post("/:id/use", validate(usePromptSchema), promptController.usePrompt);

export default router;

