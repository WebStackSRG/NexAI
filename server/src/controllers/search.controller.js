import * as searchService from "../services/search.service.js";

/**
 * GET /search?q=&limit= — Unified multimodal search endpoint
 */
export const search = async (req, res, next) => {
  try {
    const { q, limit } = req.query;
    const data = await searchService.executeUnifiedSearch(
      req.user._id,
      q,
      limit,
    );
    return res.json(data);
  } catch (err) {
    next(err);
  }
};

