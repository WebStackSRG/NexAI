import { z } from 'zod';

export const updateSettingsSchema = z.object({
  theme: z.enum(['dark', 'light']).optional(),
  defaultModel: z.enum(['flash', 'pro']).optional(),
  webSearchDefaultOn: z.boolean().optional(),
});
