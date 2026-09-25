import { getGeminiClient, getModelName } from '../config/gemini.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

/**
 * Parses raw Gemini SDK errors and extracts clean, user-friendly messages and status codes.
 *
 * @param {any} error
 * @returns {ApiError}
 */
export function parseGeminiError(error) {
  if (error instanceof ApiError) return error;

  let statusCode = 502;
  let code = 'GEMINI_API_ERROR';
  let message = 'Failed to generate response from Gemini';

  const rawMessage = error?.message || '';

  try {
    let parsed = JSON.parse(rawMessage);
    let attempts = 0;
    while (parsed && typeof parsed === 'object' && attempts < 5) {
      attempts++;
      if (parsed.error && typeof parsed.error === 'object') {
        parsed = parsed.error;
        continue;
      }
      if (typeof parsed.message === 'string' && parsed.message.trim().startsWith('{')) {
        try {
          parsed = JSON.parse(parsed.message);
          continue;
        } catch {
          // not JSON, keep string
        }
      }
      if (parsed.code) statusCode = Number(parsed.code) || statusCode;
      if (parsed.status) code = String(parsed.status);
      if (parsed.message) message = String(parsed.message);
      break;
    }
  } catch {
    if (rawMessage) {
      message = rawMessage;
    }
  }

  // Friendly messages for high demand spikes (503) or rate limits (429)
  if (
    statusCode === 503 ||
    rawMessage.includes('503') ||
    rawMessage.includes('high demand') ||
    code === 'UNAVAILABLE'
  ) {
    statusCode = 503;
    code = 'SERVICE_UNAVAILABLE';
    message =
      'This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again in a few moments.';
  } else if (statusCode === 429 || rawMessage.includes('429') || code === 'RESOURCE_EXHAUSTED') {
    statusCode = 429;
    code = 'RATE_LIMIT_EXCEEDED';
    message = 'Rate limit exceeded. Please wait a moment before sending another message.';
  }

  return new ApiError(statusCode, code, message);
}

/**
 * Streams content from Gemini with real token usage reporting and automatic transient retry.
 *
 * @param {Object} options
 * @param {Array<{role: string, parts: Array<{text: string}>}> | string} options.contents - Conversation history
 * @param {'flash' | 'pro'} [options.model='flash'] - Model tier
 * @param {string} [options.systemInstruction] - System instruction
 * @param {Record<string, unknown>} [options.config] - Additional SDK config
 * @returns {AsyncGenerator<{text: string, usageMetadata: any}, void, unknown>}
 */
export async function* streamContent({
  contents,
  model = 'flash',
  systemInstruction,
  config = {},
}) {
  const client = getGeminiClient();
  const modelName = getModelName(model);

  let stream = null;
  let attempt = 0;
  const maxRetries = 1;

  while (true) {
    try {
      stream = await client.models.generateContentStream({
        model: modelName,
        contents,
        config: {
          ...(systemInstruction ? { systemInstruction } : {}),
          ...config,
        },
      });
      break;
    } catch (err) {
      attempt++;
      const isTransient =
        err.message?.includes('503') ||
        err.message?.includes('UNAVAILABLE') ||
        err.message?.includes('high demand');

      if (isTransient && attempt <= maxRetries) {
        logger.warn(
          { attempt, maxRetries },
          'Transient Gemini 503 high demand spike, retrying after 1s...',
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }
      logger.error({ error: err.message }, 'Gemini stream initialization error');
      throw parseGeminiError(err);
    }
  }

  try {
    for await (const chunk of stream) {
      const text = chunk.text || '';
      const usageMetadata = chunk.usageMetadata || null;
      if (text || usageMetadata) {
        yield { text, usageMetadata };
      }
    }
  } catch (error) {
    logger.error({ error: error.message }, 'Gemini stream iteration error');
    throw parseGeminiError(error);
  }
}

/**
 * Generates a non-streaming completion from Gemini (e.g. for title generation, tagging).
 *
 * @param {Object} options
 * @param {Array<{role: string, parts: Array<{text: string}>}> | string} options.contents
 * @param {'flash' | 'pro'} [options.model='flash']
 * @param {string} [options.systemInstruction]
 * @param {Record<string, unknown>} [options.config]
 * @returns {Promise<{text: string, totalTokens: number, usageMetadata: any}>}
 */
export async function generateContent({
  contents,
  model = 'flash',
  systemInstruction,
  config = {},
}) {
  const client = getGeminiClient();
  const modelName = getModelName(model);

  let attempt = 0;
  const maxRetries = 1;

  while (true) {
    try {
      const response = await client.models.generateContent({
        model: modelName,
        contents,
        config: {
          ...(systemInstruction ? { systemInstruction } : {}),
          ...config,
        },
      });

      const text = response.text || '';
      const usageMetadata = response.usageMetadata || null;
      const totalTokens =
        usageMetadata?.totalTokenCount ??
        (usageMetadata?.promptTokenCount || 0) + (usageMetadata?.candidatesTokenCount || 0);

      return {
        text,
        totalTokens,
        usageMetadata,
      };
    } catch (error) {
      attempt++;
      const isTransient =
        error.message?.includes('503') ||
        error.message?.includes('UNAVAILABLE') ||
        error.message?.includes('high demand');

      if (isTransient && attempt <= maxRetries) {
        logger.warn(
          { attempt, maxRetries },
          'Transient Gemini 503 high demand spike, retrying after 1s...',
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }
      logger.error({ error: error.message }, 'Gemini generation error');
      throw parseGeminiError(error);
    }
  }
}
