import { streamContent, generateContent } from '../services/gemini.service.js';
import { deductCredits } from '../services/credit.service.js';
import { CHAT_SYSTEM_PROMPT, TITLE_SYSTEM_PROMPT } from './prompts/chat.prompt.js';
import { logger } from '../utils/logger.js';

const MAX_HISTORY_MESSAGES = 20;

/**
 * Normalizes database messages into the contents structure expected by Google GenAI.
 * Formats roles ('user' -> 'user', 'assistant' -> 'model') and ensures valid turn order.
 *
 * @param {Array<{role: string, content: string}>} rawMessages
 * @returns {Array<{role: 'user' | 'model', parts: Array<{text: string}>}>}
 */
export function formatConversationHistory(rawMessages) {
  // Take last N messages
  const sliced = rawMessages.slice(-MAX_HISTORY_MESSAGES);

  // Find first user message to guarantee conversation starts with a user turn
  const firstUserIdx = sliced.findIndex((m) => m.role === 'user');
  const validMessages = firstUserIdx >= 0 ? sliced.slice(firstUserIdx) : sliced;

  return validMessages.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));
}

/**
 * Initiates streaming response from Gemini for a chat conversation.
 *
 * @param {Object} options
 * @param {Array<{role: string, content: string}>} options.messages - Raw history
 * @param {'flash' | 'pro'} [options.model='flash'] - Model selection
 * @returns {AsyncGenerator<{text: string, usageMetadata: any}, void, unknown>}
 */
export async function* streamChatReply({ messages, model = 'flash' }) {
  const contents = formatConversationHistory(messages);

  yield* streamContent({
    contents,
    model,
    systemInstruction: CHAT_SYSTEM_PROMPT,
  });
}

/**
 * Generates a short, descriptive title for a chat based on the first message.
 * Meters token usage and logs credits if successful.
 *
 * @param {Object} options
 * @param {string} options.firstMessage - User's prompt text
 * @param {string} options.userId - ID of the user owning the chat
 * @returns {Promise<{title: string, tokensUsed: number, creditsDeducted: number}>}
 */
export async function generateChatTitle({ firstMessage, userId }) {
  try {
    const result = await generateContent({
      contents: [{ role: 'user', parts: [{ text: firstMessage }] }],
      model: 'flash',
      systemInstruction: TITLE_SYSTEM_PROMPT,
      config: {
        maxOutputTokens: 30,
        temperature: 0.3,
      },
    });

    let title = result.text.replace(/["'\n\r]/g, '').trim();
    if (!title || title.length > 80) {
      title = firstMessage.slice(0, 40).trim();
    }

    let creditsDeducted = 0;
    if (result.totalTokens > 0 && userId) {
      try {
        const deduction = await deductCredits({
          userId,
          tokensUsed: result.totalTokens,
          feature: 'chat',
          model: 'flash',
        });
        creditsDeducted = deduction.creditsDeducted;
      } catch (deductErr) {
        logger.warn({ error: deductErr.message }, 'Failed to deduct credits for title generation');
      }
    }

    return {
      title,
      tokensUsed: result.totalTokens || 0,
      creditsDeducted,
    };
  } catch (error) {
    logger.warn(
      { error: error.message },
      'Failed to auto-generate chat title from Gemini; using fallback',
    );
    const fallbackTitle = firstMessage.slice(0, 40).trim() || 'New Chat';
    return {
      title: fallbackTitle,
      tokensUsed: 0,
      creditsDeducted: 0,
    };
  }
}
