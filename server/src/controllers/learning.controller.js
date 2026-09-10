import { summarizeYouTubeVideo } from '../services/learning.service.js';
import { youtubeSummarySchema } from '../schemas/flashcard.schema.js';

export async function summarizeYouTube(req, res, next) {
  try {
    const validated = youtubeSummarySchema.parse(req.body);
    const summary = await summarizeYouTubeVideo({ url: validated.url });
    return res.json({ summary });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: err.errors[0]?.message });
    }
    next(err);
  }
}
