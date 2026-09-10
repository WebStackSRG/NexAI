import { z } from "zod";

export const createPromptSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1, "Title is required").max(160),
    template: z
      .string()
      .trim()
      .min(1, "Template content is required")
      .max(10000, "Template cannot exceed 10,000 characters"),
    tags: z.array(z.string().trim().max(40)).optional().default([]),
    pinned: z.boolean().optional().default(false),
  }),
});

export const updatePromptSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Prompt ID is required"),
  }),
  body: z.object({
    title: z.string().trim().min(1).max(160).optional(),
    template: z.string().trim().min(1).max(10000).optional(),
    tags: z.array(z.string().trim().max(40)).optional(),
    pinned: z.boolean().optional(),
  }),
});

export const promptIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Prompt ID is required"),
  }),
});

export const usePromptSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Prompt ID is required"),
  }),
  body: z.object({
    variables: z.record(z.string(), z.string()).optional(),
  }),
});
