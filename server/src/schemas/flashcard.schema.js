import { z } from 'zod';

export const createFlashcardSchema = z.object({
  question: z.string().min(1, 'Question is required').max(500),
  answer: z.string().min(1, 'Answer is required').max(2000),
  topic: z.string().max(100).optional(),
  sourceType: z.enum(['libraryItem', 'document', 'chat', 'manual', 'ai-generated']).optional(),
  sourceId: z.string().optional(),
});

export const reviewFlashcardSchema = z.object({
  grade: z.number().min(0).max(5), // 0: Again, 3: Hard, 4: Good, 5: Easy
});

export const generateFlashcardsSchema = z.object({
  topic: z.string().min(2, 'Topic is required').max(200),
  content: z.string().max(10000).optional(),
  count: z.number().min(1).max(15).optional().default(5),
});

export const youtubeSummarySchema = z.object({
  url: z.string().url('A valid YouTube URL is required'),
});
