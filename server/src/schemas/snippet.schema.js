import { z } from 'zod';

export const createSnippetSchema = z.object({
  title: z.string().min(1, 'Title is required').max(120),
  language: z.string().min(1, 'Language is required').max(50),
  code: z.string().min(1, 'Code snippet content is required'),
  tags: z.array(z.string()).optional(),
  description: z.string().max(500).optional(),
});

export const updateSnippetSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  language: z.string().min(1).max(50).optional(),
  code: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  description: z.string().max(500).optional(),
});
