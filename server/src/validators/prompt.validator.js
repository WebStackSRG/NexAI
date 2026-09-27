import { z } from 'zod';

export const createPromptSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(1, 'Title cannot be empty')
    .max(100, 'Title must not exceed 100 characters'),
  description: z
    .string()
    .trim()
    .max(500, 'Description must not exceed 500 characters')
    .optional()
    .default(''),
  template: z
    .string({ required_error: 'Template is required' })
    .min(1, 'Template cannot be empty')
    .max(10000, 'Template must not exceed 10,000 characters'),
  tags: z
    .array(
      z
        .string()
        .trim()
        .min(1, 'Tag cannot be empty')
        .max(30, 'Tag must not exceed 30 characters'),
    )
    .optional()
    .default([]),
  isFavorite: z.boolean().optional().default(false),
});

export const updatePromptSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Title cannot be empty')
      .max(100, 'Title must not exceed 100 characters')
      .optional(),
    description: z
      .string()
      .trim()
      .max(500, 'Description must not exceed 500 characters')
      .optional(),
    template: z
      .string()
      .min(1, 'Template cannot be empty')
      .max(10000, 'Template must not exceed 10,000 characters')
      .optional(),
    tags: z
      .array(
        z
          .string()
          .trim()
          .min(1, 'Tag cannot be empty')
          .max(30, 'Tag must not exceed 30 characters'),
      )
      .optional(),
    isFavorite: z.boolean().optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided for update',
  );

export const promptIdParamSchema = z.object({
  id: z
    .string({ required_error: 'Prompt ID is required' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid prompt ID format'),
});

export const getPromptsQuerySchema = z.object({
  tag: z.string().trim().optional(),
  search: z.string().trim().optional(),
  isFavorite: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
});
