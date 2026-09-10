import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
  saveLibraryItemSchema,
  confirmLibraryItemSchema,
} from "../schemas/library.schema.js";
import { uploadFileSchema } from "../schemas/file.schema.js";
import * as libraryController from "../controllers/library.controller.js";
import * as fileController from "../controllers/file.controller.js";

const router = Router();

// Protect all library routes
router.use(authMiddleware);

router.post("/save", validate(saveLibraryItemSchema), libraryController.save);
router.patch("/:id/confirm", validate(confirmLibraryItemSchema), libraryController.confirm);
router.post("/upload", validate(uploadFileSchema), fileController.uploadFile);
router.get("/", libraryController.list);
router.delete("/:id", libraryController.remove);

export default router;

