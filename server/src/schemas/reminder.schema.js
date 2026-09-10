import { z } from 'zod';

export const createReminderSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  remindAt: z.string().or(z.date()).refine((val) => !isNaN(new Date(val).getTime()), {
    message: 'Invalid date format for remindAt',
  }),
  itemType: z.enum(['library', 'document', 'flashcard', 'custom']).optional(),
  itemId: z.string().optional(),
});

export const updateReminderSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  remindAt: z.string().or(z.date()).optional(),
  isCompleted: z.boolean().optional(),
});

export const createWorkspaceSessionSchema = z.object({
  name: z.string().min(1, 'Session name is required').max(100),
  description: z.string().max(300).optional(),
  links: z.array(
    z.object({
      title: z.string().min(1, 'Link title required'),
      url: z.string().url('Invalid URL format'),
    })
  ).min(1, 'At least one link is required'),
});

export const updateQuietHoursSchema = z.object({
  enabled: z.boolean(),
  start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format HH:mm required'),
  end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format HH:mm required'),
});
