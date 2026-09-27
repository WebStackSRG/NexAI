import { z } from 'zod';

export const searchQuerySchema = z.object({
  q: z
    .string({
      required_error: 'Search query is required',
    })
    .trim()
    .min(1, 'Search query cannot be empty')
    .max(200, 'Search query must be under 200 characters'),
  type: z.enum(['all', 'library', 'prompts', 'chats']).default('all'),
  limit: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === null || val === '') return 20;
      const num = typeof val === 'number' ? val : parseInt(val, 10);
      return Number.isNaN(num) ? 20 : num;
    })
    .pipe(z.number().min(1).max(50)),
});
