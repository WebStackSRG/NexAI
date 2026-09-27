import { asyncHandler } from '../utils/asyncHandler.js';
import * as searchService from '../services/search.service.js';

/**
 * Executes a unified search across Library, Prompts, and Chats.
 * GET /api/search?q=&type=&limit=
 */
export const searchAll = asyncHandler(async (req, res) => {
  const { q, type, limit } = req.query;
  const results = await searchService.unifiedSearch(req.user._id, {
    q,
    type,
    limit,
  });

  res.status(200).json({
    data: results,
  });
});
