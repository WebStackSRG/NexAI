import { z } from "zod";

export const searchSchema = z.object({
  query: z.object({
    q: z
      .string()
      .trim()
      .max(200, "Search query cannot exceed 200 characters")
      .optional()
      .default(""),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 5))
      .pipe(z.number().int().min(1).max(20)),
  }),
});

