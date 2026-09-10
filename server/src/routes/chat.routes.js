import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
  createChatSchema,
  updateChatSchema,
  sendMessageSchema,
} from "../schemas/chat.schema.js";
import * as chatController from "../controllers/chat.controller.js";

const router = Router();

// Protect all chat endpoints with JWT auth middleware
router.use(authMiddleware);

// Chat session CRUD
router.get("/", chatController.listChats);
router.post("/", validate(createChatSchema), chatController.createChat);
router.get("/:id", chatController.getChat);
router.patch("/:id", validate(updateChatSchema), chatController.updateChat);
router.delete("/:id", chatController.deleteChat);

// Streaming message endpoint
router.post("/message", validate(sendMessageSchema), chatController.streamMessage);

export default router;
