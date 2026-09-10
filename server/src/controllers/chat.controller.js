import * as chatService from "../services/chat.service.js";
import { streamChatResponse } from "../services/gemini.service.js";

/**
 * GET /chat — List all active chats for authenticated user
 */
export const listChats = async (req, res, next) => {
  try {
    const chats = await chatService.getUserChats(req.user._id);
    return res.json({ chats });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /chat — Create a new chat session
 */
export const createChat = async (req, res, next) => {
  try {
    const chat = await chatService.createChat(req.user._id, req.body);
    return res.status(201).json({ chat });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /chat/:id — Retrieve single chat and its messages
 */
export const getChat = async (req, res, next) => {
  try {
    const { id } = req.params;
    const chat = await chatService.getChatById(id, req.user._id);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    const messages = await chatService.getChatMessages(id, req.user._id);
    return res.json({ chat, messages });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /chat/:id — Update chat properties (rename, pin, archive)
 */
export const updateChat = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedChat = await chatService.updateChat(
      id,
      req.user._id,
      req.body,
    );
    if (!updatedChat) {
      return res.status(404).json({ error: "Chat not found" });
    }
    return res.json({ chat: updatedChat });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /chat/:id — Delete chat and its message history
 */
export const deleteChat = async (req, res, next) => {
  try {
    const { id } = req.params;
    const success = await chatService.deleteChat(id, req.user._id);
    if (!success) {
      return res.status(404).json({ error: "Chat not found" });
    }
    return res.json({ success: true, message: "Chat deleted successfully" });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /chat/message — Server-Sent Events (SSE) streaming chat endpoint
 */
export const streamMessage = async (req, res) => {
  const startTime = Date.now();
  const abortController = new AbortController();

  req.on("close", () => {
    abortController.abort();
  });

  // Setup Server-Sent Events headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    let { chatId, content, parentId } = req.body;
    let chat = null;

    if (chatId) {
      chat = await chatService.getChatById(chatId, req.user._id);
      if (!chat) {
        sendEvent({ error: "Chat session not found" });
        return res.end();
      }
    } else {
      // Create new chat automatically
      chat = await chatService.createChat(req.user._id, {
        title: "New Chat",
      });
      chatId = chat._id || chat.id;
    }

    // Persist user message
    const userMsg = await chatService.saveUserMessage(
      chatId,
      req.user._id,
      content,
      { parentId },
    );

    // Notify client of chat & user message confirmation
    sendEvent({
      type: "session_init",
      chat,
      userMessage: userMsg,
    });

    // Fetch previous messages for context (capped at last 20 messages)
    const history = (await chatService.getChatMessages(chatId, req.user._id)) || [];
    const contextMessages = history.slice(-20);

    const systemInstruction = req.user.globalInstructions || "";
    let accumulatedText = "";

    // Stream chunks from Gemini service
    const stream = streamChatResponse({
      messages: contextMessages,
      systemInstruction,
      model: "gemini-2.0-flash",
      abortSignal: abortController.signal,
    });

    for await (const chunk of stream) {
      if (abortController.signal.aborted) break;
      accumulatedText += chunk;
      sendEvent({
        type: "chunk",
        chunk,
      });
    }

    const latencyMs = Date.now() - startTime;

    // Persist complete assistant message
    const assistantMsg = await chatService.saveAssistantMessage(
      chatId,
      req.user._id,
      accumulatedText,
      {
        model: "gemini-2.0-flash",
        latencyMs,
        parentId: userMsg._id || userMsg.id,
      },
    );

    // Trigger auto-titling asynchronously if needed
    if (chat.title === "New Chat") {
      chatService.autoTitleChat(chatId, req.user._id, content).then(async () => {
        const freshChat = await chatService.getChatById(chatId, req.user._id);
        if (freshChat && freshChat.title !== "New Chat") {
          sendEvent({
            type: "chat_updated",
            chat: freshChat,
          });
        }
      });
    }

    // Send final completion event
    sendEvent({
      type: "done",
      message: assistantMsg,
      chat,
    });

    res.end();
  } catch (error) {
    console.error("[ChatController] SSE Stream error:", error.message);
    sendEvent({
      type: "error",
      error: error.message || "An error occurred during generation",
    });
    res.end();
  }
};
