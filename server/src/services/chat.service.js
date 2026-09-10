import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import { getDbStatus } from "../config/db.js";
import { generateChatTitle } from "./gemini.service.js";

// In-memory dev cache for chats and messages when MongoDB is offline
const devChatsMap = new Map();
const devMessagesMap = new Map();

/**
 * Fetch all chats for a given user
 */
export const getUserChats = async (userId) => {
  if (getDbStatus().isConnected) {
    try {
      return await Chat.find({ userId, archived: false })
        .sort({ pinned: -1, updatedAt: -1 })
        .lean();
    } catch (err) {
      console.warn(
        "[ChatService] MongoDB query failed, using dev cache:",
        err.message,
      );
    }
  }

  // Dev fallback
  const userChats = Array.from(devChatsMap.values())
    .filter((c) => c.userId === userId.toString() && !c.archived)
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

  return userChats;
};

/**
 * Fetch single chat by ID and verify user ownership
 */
export const getChatById = async (chatId, userId) => {
  if (getDbStatus().isConnected) {
    try {
      const chat = await Chat.findOne({
        _id: chatId,
        userId,
      }).lean();
      if (chat) return chat;
    } catch (err) {
      // Fallback
    }
  }

  const devChat = devChatsMap.get(chatId.toString());
  if (devChat && devChat.userId === userId.toString()) {
    return devChat;
  }

  return null;
};

/**
 * Create a new chat session
 */
export const createChat = async (
  userId,
  { title = "New Chat", projectId = null } = {},
) => {
  if (getDbStatus().isConnected) {
    try {
      const chat = await Chat.create({
        userId,
        projectId,
        title,
        pinned: false,
        archived: false,
      });
      return chat.toObject();
    } catch (err) {
      console.warn(
        "[ChatService] MongoDB create failed, using dev cache:",
        err.message,
      );
    }
  }

  const mockId = `dev-chat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newDevChat = {
    _id: mockId,
    id: mockId,
    userId: userId.toString(),
    projectId,
    title,
    pinned: false,
    archived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  devChatsMap.set(mockId, newDevChat);
  return newDevChat;
};

/**
 * Update chat properties (title, pinned, archived)
 */
export const updateChat = async (chatId, userId, updates = {}) => {
  const allowedUpdates = {};
  if (typeof updates.title === "string")
    allowedUpdates.title = updates.title.trim();
  if (typeof updates.pinned === "boolean")
    allowedUpdates.pinned = updates.pinned;
  if (typeof updates.archived === "boolean") {
    allowedUpdates.archived = updates.archived;
    if (updates.archived) allowedUpdates.archivedAt = new Date();
  }
  allowedUpdates.updatedAt = new Date();

  if (getDbStatus().isConnected) {
    try {
      const updated = await Chat.findOneAndUpdate(
        { _id: chatId, userId },
        { $set: allowedUpdates },
        { returnDocument: "after" },
      ).lean();
      if (updated) return updated;
    } catch (err) {
      // Fall through to dev cache
    }
  }

  const devChat = devChatsMap.get(chatId.toString());
  if (devChat && devChat.userId === userId.toString()) {
    Object.assign(devChat, allowedUpdates);
    return devChat;
  }

  return null;
};

/**
 * Delete chat session and its associated messages
 */
export const deleteChat = async (chatId, userId) => {
  if (getDbStatus().isConnected) {
    try {
      const deleted = await Chat.findOneAndDelete({ _id: chatId, userId });
      if (deleted) {
        await Message.deleteMany({ chatId });
        return true;
      }
      return false;
    } catch (err) {
      // Fall through
    }
  }

  const devChat = devChatsMap.get(chatId.toString());
  if (devChat && devChat.userId === userId.toString()) {
    devChatsMap.delete(chatId.toString());
    devMessagesMap.delete(chatId.toString());
    return true;
  }

  return false;
};

/**
 * Fetch messages for a specific chat
 */
export const getChatMessages = async (chatId, userId, limit = 100) => {
  // Validate ownership first
  const chat = await getChatById(chatId, userId);
  if (!chat) return null;

  if (getDbStatus().isConnected) {
    try {
      return await Message.find({ chatId })
        .sort({ createdAt: 1 })
        .limit(limit)
        .lean();
    } catch (err) {
      console.warn(
        "[ChatService] MongoDB getMessages failed, using dev cache:",
        err.message,
      );
    }
  }

  const messages = devMessagesMap.get(chatId.toString()) || [];
  return [...messages].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  );
};

/**
 * Save user message
 */
export const saveUserMessage = async (
  chatId,
  userId,
  content,
  { parentId = null, branchIndex = 0 } = {},
) => {
  const now = new Date();

  if (getDbStatus().isConnected) {
    try {
      const msg = await Message.create({
        chatId,
        userId,
        role: "user",
        content,
        parentId,
        branchIndex,
        createdAt: now,
      });
      await Chat.findByIdAndUpdate(chatId, { $set: { updatedAt: now } });
      return msg.toObject();
    } catch (err) {
      console.warn(
        "[ChatService] MongoDB saveUserMessage failed, using dev cache:",
        err.message,
      );
    }
  }

  const mockMsgId = `dev-msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const userMsg = {
    _id: mockMsgId,
    id: mockMsgId,
    chatId: chatId.toString(),
    userId: userId.toString(),
    role: "user",
    content,
    parentId,
    branchIndex,
    createdAt: now,
  };

  const list = devMessagesMap.get(chatId.toString()) || [];
  list.push(userMsg);
  devMessagesMap.set(chatId.toString(), list);

  const devChat = devChatsMap.get(chatId.toString());
  if (devChat) {
    devChat.updatedAt = now;
  }

  return userMsg;
};

/**
 * Save assistant message
 */
export const saveAssistantMessage = async (
  chatId,
  userId,
  content,
  {
    model = "gemini-2.0-flash",
    latencyMs = 0,
    toolCalls = [],
    parentId = null,
  } = {},
) => {
  const now = new Date();

  if (getDbStatus().isConnected) {
    try {
      const msg = await Message.create({
        chatId,
        userId,
        role: "assistant",
        content,
        model,
        latencyMs,
        toolCalls,
        parentId,
        createdAt: now,
      });
      await Chat.findByIdAndUpdate(chatId, { $set: { updatedAt: now } });
      return msg.toObject();
    } catch (err) {
      console.warn(
        "[ChatService] MongoDB saveAssistantMessage failed, using dev cache:",
        err.message,
      );
    }
  }

  const mockMsgId = `dev-msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const assistantMsg = {
    _id: mockMsgId,
    id: mockMsgId,
    chatId: chatId.toString(),
    userId: userId.toString(),
    role: "assistant",
    content,
    model,
    latencyMs,
    toolCalls,
    parentId,
    createdAt: now,
  };

  const list = devMessagesMap.get(chatId.toString()) || [];
  list.push(assistantMsg);
  devMessagesMap.set(chatId.toString(), list);

  const devChat = devChatsMap.get(chatId.toString());
  if (devChat) {
    devChat.updatedAt = now;
  }

  return assistantMsg;
};

/**
 * Auto-title chat if title is currently default 'New Chat'
 */
export const autoTitleChat = async (chatId, userId, userMessageText) => {
  try {
    const chat = await getChatById(chatId, userId);
    if (!chat || chat.title !== "New Chat") return;

    const newTitle = await generateChatTitle(userMessageText);
    if (newTitle && newTitle !== "New Chat") {
      await updateChat(chatId, userId, { title: newTitle });
    }
  } catch (err) {
    console.warn("[ChatService] Auto-titling error:", err.message);
  }
};
