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

  return validMessages.map((msg) => {
    const parts = [{ text: msg.content || '' }];

    if (Array.isArray(msg.attachments)) {
      for (const att of msg.attachments) {
        if (att.data && att.mimeType) {
          const base64Data = att.data.includes('base64,')
            ? att.data.split('base64,')[1]
            : att.data;
          parts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: base64Data,
            },
          });
        }
      }
    }

    return {
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts,
    };
  });
}

/**
 * Initiates streaming response from Gemini for a chat conversation.
 *
 * @param {Object} options
 * @param {Array<{role: string, content: string}>} options.messages - Raw history
 * @param {'flash' | 'pro'} [options.model='flash'] - Model selection
 * @param {string} [options.customInstructions=''] - Custom project or user instructions
 * @param {Array<{name: string, content: string, mimeType?: string}>} [options.sources=[]] - Project sources
 * @returns {AsyncGenerator<{text: string, usageMetadata: any}, void, unknown>}
 */
export async function* streamChatReply({
  messages,
  model = 'flash',
  customInstructions = '',
  sources = [],
}) {
  const contents = formatConversationHistory(messages);

  let systemInstruction = CHAT_SYSTEM_PROMPT;
  if (customInstructions && customInstructions.trim()) {
    systemInstruction += `\n\n[PROJECT CUSTOM INSTRUCTIONS]:\nFollow these custom project instructions for all responses:\n${customInstructions.trim()}`;
  }

  if (Array.isArray(sources) && sources.length > 0) {
    const formattedSources = sources
      .map((s, idx) => {
        const fileHeading = `--- SOURCE ${idx + 1}: ${s.name || s.originalName || 'Document'} (${s.mimeType || 'text'}) ---`;
        const safeContent = (s.content || '').slice(0, 50000);
        return `${fileHeading}\n${safeContent}\n${'-'.repeat(fileHeading.length)}`;
      })
      .join('\n\n');

    systemInstruction += `\n\n[PROJECT KNOWLEDGE BASE / SOURCES]:\nThe user has uploaded the following project source files. Use this knowledge base as primary ground truth context to answer questions accurately:\n\n${formattedSources}`;
  }

  yield* streamContent({
    contents,
    model,
    systemInstruction,
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
