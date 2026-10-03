import { z } from 'zod';
import { generateContent } from '../services/gemini.service.js';
import { TAGGING_SYSTEM_PROMPT } from './prompts/tagging.prompt.js';
import { logger } from '../utils/logger.js';

const taggingOutputSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  summary: z.string().min(1, 'Summary is required'),
  tags: z.array(z.string()).min(1, 'At least one tag is required'),
});

/**
 * Normalizes tags to 3-6 clean, lowercase, hyphenated strings.
 *
 * @param {string[]} rawTags
 * @returns {string[]}
 */
function normalizeTags(rawTags) {
  const cleaned = rawTags
    .map((tag) =>
      tag
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]/g, '')
        .replace(/^-+|-+$/g, ''),
    )
    .filter((tag) => tag.length >= 2 && tag.length <= 30);

  const unique = Array.from(new Set(cleaned));
  if (unique.length < 3) {
    if (!unique.includes('library')) unique.push('library');
    if (!unique.includes('reference')) unique.push('reference');
    if (!unique.includes('notes')) unique.push('notes');
  }
  return unique.slice(0, 6);
}

/**
 * Extracts JSON content from raw model response text, stripping markdown fences if present.
 *
 * @param {string} text
 * @returns {any}
 */
function parseJsonOutput(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/, '')
      .trim();
  }
  return JSON.parse(cleaned);
}

/**
 * Categorization and Tagging agent that analyzes content and generates
 * suggested title, summary, and tags with Gemini.
 *
 * @param {Object} options
 * @param {string} options.content - Raw extracted webpage text or user note
 * @param {string} [options.suggestedTitle] - Initial title hint if available
 * @returns {Promise<{ title: string, summary: string, tags: string[], tokensUsed: number }>}
 */
export async function generateLibrarySuggestion({
  content = '',
  suggestedTitle = '',
  fileBase64 = null,
  mimeType = null,
}) {
  const parts = [];

  if (fileBase64 && mimeType) {
    parts.push({
      inlineData: {
        data: fileBase64,
        mimeType,
      },
    });
  }

  const promptUserMessage = suggestedTitle
    ? `Title hint: ${suggestedTitle}\n\nContent:\n${content}`
    : `Content:\n${content}`;

  parts.push({ text: promptUserMessage });

  try {
    const result = await generateContent({
      contents: [{ role: 'user', parts }],
      model: 'flash',
      systemInstruction: TAGGING_SYSTEM_PROMPT,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });


    const parsedJson = parseJsonOutput(result.text);
    const validated = taggingOutputSchema.parse(parsedJson);

    return {
      title: validated.title.trim().slice(0, 150),
      summary: validated.summary.trim(),
      tags: normalizeTags(validated.tags),
      tokensUsed: result.totalTokens || 0,
    };
  } catch (err) {
    logger.warn({ error: err.message }, 'Failed to generate tagging suggestion via Gemini JSON');
    // Fallback extraction
    const fallbackTitle = suggestedTitle || content.slice(0, 40).trim() || 'Untitled Note';
    const fallbackSummary = content.slice(0, 200).trim() || 'No summary available.';
    return {
      title: fallbackTitle,
      summary: fallbackSummary,
      tags: ['library', 'notes', 'saved'],
      tokensUsed: 0,
    };
  }
}
