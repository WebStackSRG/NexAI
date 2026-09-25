import { Chat } from '../models/Chat.js';
import { Message } from '../models/Message.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { setupSse, sendSse, closeSse } from '../utils/sse.js';
import { streamChatReply, generateChatTitle } from '../agents/chat.agent.js';
import { deductCredits } from '../services/credit.service.js';
import { logger } from '../utils/logger.js';

/**
 * Returns all chats for the authenticated user, ordered by most recently updated.
 * GET /api/chats
 */
export const getChats = asyncHandler(async (req, res) => {
  const chats = await Chat.find({ userId: req.user._id }).sort({ updatedAt: -1 });
  res.status(200).json({ data: chats });
});

/**
 * Creates a new chat session for the authenticated user.
 * POST /api/chats
 */
export const createChat = asyncHandler(async (req, res) => {
  const { title } = req.body;
  const chat = await Chat.create({
    userId: req.user._id,
    title: title || 'New Chat',
  });
  res.status(201).json({ data: chat });
});

/**
 * Updates the title of an existing chat session.
 * PATCH /api/chats/:id
 */
export const updateChat = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;

  const chat = await Chat.findOne({ _id: id, userId: req.user._id });
  if (!chat) {
    throw new ApiError(404, 'CHAT_NOT_FOUND', 'Chat conversation not found');
  }

  chat.title = title;
  await chat.save();

  res.status(200).json({ data: chat });
});

/**
 * Deletes a chat session and all associated messages.
 * DELETE /api/chats/:id
 */
export const deleteChat = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const chat = await Chat.findOne({ _id: id, userId: req.user._id });
  if (!chat) {
    throw new ApiError(404, 'CHAT_NOT_FOUND', 'Chat conversation not found');
  }

  await Message.deleteMany({ chatId: chat._id });
  await chat.deleteOne();

  res.status(200).json({ data: { message: 'Chat deleted successfully' } });
});

/**
 * Retrieves all messages within a specific chat.
 * GET /api/chats/:id/messages
 */
export const getMessages = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const chat = await Chat.findOne({ _id: id, userId: req.user._id });
  if (!chat) {
    throw new ApiError(404, 'CHAT_NOT_FOUND', 'Chat conversation not found');
  }

  const messages = await Message.find({ chatId: chat._id }).sort({ createdAt: 1 });
  res.status(200).json({ data: messages });
});

/**
 * Sends a message in a chat and streams the AI assistant response via SSE.
 * POST /api/chats/:id/messages
 */
export async function sendMessage(req, res, next) {
  const { id } = req.params;
  const { content, model: requestedModel } = req.body;
  const model = requestedModel || req.user.settings?.defaultModel || 'flash';

  let sseStarted = false;

  try {
    const chat = await Chat.findOne({ _id: id, userId: req.user._id });
    if (!chat) {
      throw new ApiError(404, 'CHAT_NOT_FOUND', 'Chat conversation not found');
    }

    // Save incoming user message
    await Message.create({
      chatId: chat._id,
      role: 'user',
      content,
    });

    // Check if chat is still using default title to auto-generate title
    const existingMessagesCount = await Message.countDocuments({ chatId: chat._id });
    if (chat.title === 'New Chat' || existingMessagesCount <= 1) {
      const titleResult = await generateChatTitle({
        firstMessage: content,
        userId: req.user._id.toString(),
      });
      chat.title = titleResult.title;
      await chat.save();
    }

    // Initialize SSE connection
    setupSse(res);
    sseStarted = true;

    let isClientConnected = true;
    req.on('close', () => {
      isClientConnected = false;
    });

    // Load full message history for context
    const history = await Message.find({ chatId: chat._id }).sort({ createdAt: 1 });

    let fullText = '';
    let tokensUsed = 0;

    const stream = streamChatReply({
      messages: history,
      model,
    });

    for await (const chunk of stream) {
      if (!isClientConnected) {
        break;
      }

      if (chunk.text) {
        fullText += chunk.text;
        sendSse(res, 'token', { text: chunk.text });
      }

      if (chunk.usageMetadata) {
        const count =
          chunk.usageMetadata.totalTokenCount ??
          (chunk.usageMetadata.promptTokenCount || 0) +
            (chunk.usageMetadata.candidatesTokenCount || 0);
        if (count > 0) {
          tokensUsed = count;
        }
      }
    }

    // Fallback estimation if API did not return token metrics
    if (tokensUsed <= 0) {
      const totalChars =
        history.reduce((sum, m) => sum + (m.content?.length || 0), 0) + fullText.length;
      tokensUsed = Math.max(1, Math.ceil(totalChars / 4));
    }

    // Save assistant message
    const assistantMessage = await Message.create({
      chatId: chat._id,
      role: 'assistant',
      content: fullText,
      tokensUsed,
    });

    // Update chat timestamp
    chat.updatedAt = new Date();
    await chat.save();

    // Deduct credits atomically and record UsageLog
    const deduction = await deductCredits({
      userId: req.user._id,
      tokensUsed,
      feature: 'chat',
      model,
    });

    // Send final done event with metrics
    sendSse(res, 'done', {
      messageId: assistantMessage._id.toString(),
      tokensUsed,
      creditsDeducted: deduction.creditsDeducted,
      creditsRemaining: deduction.creditsRemaining,
      chatTitle: chat.title,
    });

    closeSse(res);
  } catch (error) {
    logger.error({ error: error.message }, 'Error in sendMessage SSE handler');

    const cleanMessage =
      error.message?.includes('high demand') ||
      error.message?.includes('503') ||
      error.message?.includes('UNAVAILABLE')
        ? 'This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again in a few moments.'
        : error.message || 'An error occurred while streaming response';

    if (sseStarted) {
      sendSse(res, 'error', {
        code: error.code || 'STREAM_ERROR',
        message: cleanMessage,
      });
      closeSse(res);
    } else {
      next(error);
    }
  }
}
