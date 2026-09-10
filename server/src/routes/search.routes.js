import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { searchSchema } from "../schemas/search.schema.js";
import * as searchController from "../controllers/search.controller.js";

const router = Router();

// Protect search route
router.use(authMiddleware);

// Unified global search
router.get("/", validate(searchSchema), searchController.search);

export default router;

