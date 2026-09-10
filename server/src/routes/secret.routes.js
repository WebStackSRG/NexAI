import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  getSecrets,
  createSecret,
  updateSecret,
  deleteSecret,
} from "../controllers/secret.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getSecrets);
router.post("/", createSecret);
router.put("/:id", updateSecret);
router.delete("/:id", deleteSecret);

export default router;
