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


export const creativeContinueSchema = z.object({
  body: z.object({
    title: z.string().trim().optional().default("Untitled Story"),
    genre: z.string().trim().optional().default("sci-fi"),
    tone: z.string().trim().optional().default("dark"),
    style: z.string().trim().optional().default("descriptive"),
    chapterNumber: z.number().int().min(1).default(1),
    characters: z.array(z.object({
      name: z.string().min(1),
      role: z.string().optional(),
      description: z.string().optional(),
    })).optional().default([]),
    worldNotes: z.string().optional().default(""),
    previousContext: z.string().optional().default(""),
    instruction: z.string().optional().default("Advance the plot and escalate tension"),
  }),
});
