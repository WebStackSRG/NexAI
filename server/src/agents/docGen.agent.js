import { z } from 'zod';
import { generateContent } from '../services/gemini.service.js';
import { DOC_GEN_SYSTEM_PROMPT } from './prompts/docGen.prompt.js';
import { logger } from '../utils/logger.js';

const docGenOutputSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  category: z.enum(['resume', 'report', 'spec', 'notes', 'other']).default('other'),
  summary: z.string().min(1, 'Summary is required'),
  sections: z
    .array(
      z.object({
        heading: z.string().min(1, 'Section heading is required'),
        body: z.string().min(1, 'Section body is required'),
      }),
    )
    .min(1, 'At least one section is required'),
});

/**
 * Strips markdown code fences (```json ... ```) and parses the JSON.
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
 * Generates a structured document draft using Gemini Flash with JSON mode.
 *
 * @param {Object} params
 * @param {string} params.prompt - Topic / description / requirements
 * @param {'resume' | 'report' | 'spec' | 'notes' | 'other'} [params.category='other']
 * @returns {Promise<{ title: string, category: string, summary: string, sections: Array<{ heading: string, body: string }>, tokensUsed: number }>}
 */
export async function generateDocumentDraft({ prompt, category = 'other' }) {
  const userContent = `Category: ${category}\nPrompt / Requirements:\n${prompt}`;

  try {
    const result = await generateContent({
      contents: [{ role: 'user', parts: [{ text: userContent }] }],
      model: 'flash',
      systemInstruction: DOC_GEN_SYSTEM_PROMPT,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const parsedJson = parseJsonOutput(result.text);
    const validated = docGenOutputSchema.parse(parsedJson);

    return {
      title: validated.title.trim(),
      category: validated.category,
      summary: validated.summary.trim(),
      sections: validated.sections.map((s) => ({
        heading: s.heading.trim(),
        body: s.body.trim(),
      })),
      tokensUsed: result.totalTokens || 0,
    };
  } catch (err) {
    logger.warn({ error: err.message }, 'Failed to generate document draft via Gemini JSON; using fallback template');

    // Resilient fallback structure based on category
    const defaultTitle = prompt.slice(0, 50).trim() || 'Untitled Document';
    return {
      title: defaultTitle,
      category,
      summary: `Document draft generated for "${defaultTitle}".`,
      sections: [
        {
          heading: 'Overview',
          body: `Draft generated based on requirements: ${prompt}`,
        },
        {
          heading: 'Details & Analysis',
          body: 'This section contains the core analysis, specifications, and details.',
        },
        {
          heading: 'Action Items & Next Steps',
          body: '- Review and refine the document sections.\n- Add custom domain specifics.\n- Export to PDF or save to Library.',
        },
      ],
      tokensUsed: 0,
    };
  }
}
