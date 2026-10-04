import { z } from 'zod';

export const adminQueryUsageSchema = z.object({
  range: z.enum(['7d', '30d']).optional().default('7d'),
});

export const adminPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const adminUpdateConfigSchema = z.object({
  billingEnforcementMode: z.enum(['quota_free', 'credit_strict']).optional(),
  dailyGeminiQuotaLimit: z.coerce.number().int().min(1).max(100000).optional(),
});
