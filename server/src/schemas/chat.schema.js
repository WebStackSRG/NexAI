import { z } from "zod";

export const createChatSchema = z.object({
  body: z.object({
    title: z.string().trim().max(100).optional(),
    projectId: z.string().optional(),
  }),
});

export const updateChatSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Chat ID is required"),
  }),
  body: z.object({
    title: z.string().trim().min(1).max(100).optional(),
    pinned: z.boolean().optional(),
    archived: z.boolean().optional(),
  }),
});

export const sendMessageSchema = z.object({
  body: z.object({
    chatId: z.string().optional(),
    content: z
      .string()
      .trim()
      .min(1, "Message content cannot be empty")
      .max(20000, "Message exceeds 20,000 character limit"),
    parentId: z.string().optional(),
  }),
});
