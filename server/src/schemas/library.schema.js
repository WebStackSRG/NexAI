import { z } from "zod";

export const saveLibraryItemSchema = z.object({
  body: z
    .object({
      url: z.string().trim().optional(),
      content: z.string().trim().max(50000, "Content cannot exceed 50,000 chars").optional(),
      type: z.enum(["link", "note", "file", "document", "youtube"]).optional(),
      title: z.string().trim().max(160).optional(),
    })
    .refine((data) => data.url || data.content, {
      message: "Either url or content must be provided",
    }),
});

export const confirmLibraryItemSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Item ID is required"),
  }),
  body: z.object({
    title: z.string().trim().min(1).max(160).optional(),
    summary: z.string().trim().max(2000).optional(),
    tags: z.array(z.string().trim().max(40)).optional(),
    folder: z.string().trim().max(50).optional(),
    pinned: z.boolean().optional(),
  }),
});
