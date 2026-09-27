import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z
    .string({ required_error: 'Project name is required' })
    .trim()
    .min(1, 'Project name cannot be empty')
    .max(100, 'Project name must not exceed 100 characters'),
  description: z
    .string()
    .trim()
    .max(500, 'Description must not exceed 500 characters')
    .optional(),
  customInstructions: z
    .string()
    .trim()
    .max(4000, 'Custom instructions must not exceed 4000 characters')
    .optional(),
  color: z
    .string()
    .trim()
    .max(30)
    .optional(),
});

export const updateProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Project name cannot be empty')
    .max(100, 'Project name must not exceed 100 characters')
    .optional(),
  description: z
    .string()
    .trim()
    .max(500, 'Description must not exceed 500 characters')
    .optional(),
  customInstructions: z
    .string()
    .trim()
    .max(4000, 'Custom instructions must not exceed 4000 characters')
    .optional(),
  color: z
    .string()
    .trim()
    .max(30)
    .optional(),
});

export const projectIdParamSchema = z.object({
  id: z
    .string({ required_error: 'Project ID is required' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid project ID format'),
});

export const addSourceSchema = z.object({
  name: z
    .string({ required_error: 'Source file name is required' })
    .trim()
    .min(1, 'Source name cannot be empty')
    .max(255, 'Source name must not exceed 255 characters'),
  originalName: z.string().trim().max(255).optional(),
  mimeType: z.string().trim().max(100).optional(),
  size: z.number().nonnegative().optional(),
  content: z.string().optional(),
});

export const sourceIdParamSchema = z.object({
  id: z
    .string({ required_error: 'Project ID is required' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid project ID format'),
  sourceId: z
    .string({ required_error: 'Source ID is required' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid source ID format'),
});

