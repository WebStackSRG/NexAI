import { getGeminiClient, getModelName } from '../config/gemini.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

/**
 * Streams content from Gemini with real token usage reporting.
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
  try {
    const client = getGeminiClient();
    const modelName = getModelName(model);

    const stream = await client.models.generateContentStream({
      model: modelName,
      contents,
      config: {
        ...(systemInstruction ? { systemInstruction } : {}),
        ...config,
      },
    });

    for await (const chunk of stream) {
      const text = chunk.text || '';
      const usageMetadata = chunk.usageMetadata || null;
      if (text || usageMetadata) {
        yield { text, usageMetadata };
      }
    }
  } catch (error) {
    logger.error({ error: error.message }, 'Gemini stream error');
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      502,
      'GEMINI_API_ERROR',
      error.message || 'Failed to stream response from Gemini',
    );
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
  try {
    const client = getGeminiClient();
    const modelName = getModelName(model);

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
    logger.error({ error: error.message }, 'Gemini generation error');
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      502,
      'GEMINI_API_ERROR',
      error.message || 'Failed to generate response from Gemini',
    );
  }
}
