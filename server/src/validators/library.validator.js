import { z } from 'zod';

export const suggestLibrarySchema = z
  .object({
    type: z.enum(['link', 'note'], {
      required_error: 'Type must be either "link" or "note"',
    }),
    url: z.string().url('A valid URL is required for link suggestions').optional(),
    content: z.string().min(3, 'Content must be at least 3 characters').optional(),
  })
  .refine(
    (data) => {
      if (data.type === 'link') return Boolean(data.url);
      if (data.type === 'note') return Boolean(data.content);
      return false;
    },
    {
      message: 'Either a valid url (for link) or content (for note) must be provided',
    },
  );

export const createLibraryItemSchema = z.object({
  type: z.enum(['link', 'note']),
  url: z.string().url().optional().or(z.literal('')),
  title: z.string().min(1, 'Title is required').max(200),
  summary: z.string().optional().default(''),
  tags: z.array(z.string()).optional().default([]),
  content: z.string().optional().default(''),
});

export const updateLibraryItemSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  summary: z.string().optional(),
  tags: z.array(z.string()).optional(),
  content: z.string().optional(),
});

export const queryLibrarySchema = z.object({
  tag: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const searchLibrarySchema = z.object({
  q: z.string().min(1, 'Query parameter "q" is required and cannot be empty'),
});
