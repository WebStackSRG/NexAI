import { z } from "zod";

export const updateUserSettingsSchema = z.object({
  body: z.object({
    globalInstructions: z
      .string()
      .max(2000, "Global instructions cannot exceed 2000 characters")
      .optional(),
    preferences: z
      .object({
        sidebarMode: z
          .enum(["general", "developer", "student", "power-user"])
          .optional(),
        theme: z.enum(["dark", "light"]).optional(),
        language: z.string().optional(),
        streamingEnabled: z.boolean().optional(),
      })
      .optional(),
    quietHours: z
      .object({
        enabled: z.boolean().optional(),
        startTime: z
          .string()
          .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Must be HH:MM format")
          .optional(),
        endTime: z
          .string()
          .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Must be HH:MM format")
          .optional(),
      })
      .optional(),
    notificationPrefs: z
      .object({
        pushEnabled: z.boolean().optional(),
        emailEnabled: z.boolean().optional(),
        brokenLinks: z.boolean().optional(),
        weeklyDigest: z.boolean().optional(),
        reminders: z.boolean().optional(),
      })
      .optional(),
  }),
});

