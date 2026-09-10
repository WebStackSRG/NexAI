import { z } from "zod";

export const generateDocumentSchema = z.object({
  body: z.object({
    topic: z
      .string()
      .trim()
      .min(3, "Topic prompt must be at least 3 characters")
      .max(500, "Topic prompt cannot exceed 500 characters"),
    title: z.string().trim().max(160).optional(),
    tone: z.enum(["professional", "academic", "technical", "creative", "executive"]).optional(),
    sectionCount: z.number().int().min(2).max(8).optional().default(4),
  }),
});

export const createDocumentSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1, "Title is required").max(160),
    sections: z
      .array(
        z.object({
          heading: z.string().trim().default(""),
          body: z.string().default(""),
          imageUrl: z.string().optional(),
          order: z.number().int().default(0),
        }),
      )
      .optional()
      .default([]),
  }),
});

export const updateDocumentSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Document ID is required"),
  }),
  body: z.object({
    title: z.string().trim().min(1).max(160).optional(),
    sections: z
      .array(
        z.object({
          _id: z.string().optional(),
          heading: z.string().trim().default(""),
          body: z.string().default(""),
          imageUrl: z.string().optional(),
          order: z.number().int().default(0),
        }),
      )
      .optional(),
    exportFormat: z.enum(["pdf", "docx"]).optional(),
  }),
});

export const documentIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Document ID is required"),
  }),
});

