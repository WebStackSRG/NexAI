import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
  generateDocumentSchema,
  createDocumentSchema,
  updateDocumentSchema,
  documentIdParamSchema,
} from "../schemas/document.schema.js";
import * as documentController from "../controllers/document.controller.js";

const router = Router();

// Protect all document routes
router.use(authMiddleware);

// AI Section Generation via Gemini 2.5 Pro
router.post(
  "/generate",
  validate(generateDocumentSchema),
  documentController.generateSections,
);

// Document CRUD
router.get("/", documentController.listDocuments);
router.post(
  "/",
  validate(createDocumentSchema),
  documentController.createDocument,
);
router.get(
  "/:id",
  validate(documentIdParamSchema),
  documentController.getDocument,
);
router.patch(
  "/:id",
  validate(updateDocumentSchema),
  documentController.updateDocument,
);
router.delete(
  "/:id",
  validate(documentIdParamSchema),
  documentController.deleteDocument,
);

// Index finished document into Knowledge Library
router.post(
  "/:id/index-library",
  validate(documentIdParamSchema),
  documentController.indexToLibrary,
);

export default router;

