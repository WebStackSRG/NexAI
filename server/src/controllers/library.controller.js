import { LibraryItem } from '../models/LibraryItem.js';
import { extractLinkContent } from '../services/linkExtractor.service.js';
import { generateLibrarySuggestion } from '../agents/tagging.agent.js';
import { deductCredits } from '../services/credit.service.js';
import { embedContent } from '../services/gemini.service.js';
import { vectorDbService } from '../services/vectorDb.service.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logger } from '../utils/logger.js';

/**
 * Generates an AI-suggested title, summary, and tags for a link or note without saving.
 * Metered via creditCheck and credit deduction.
 */
export const suggestItem = asyncHandler(async (req, res) => {
  const { type, url, content } = req.body;
  let textToAnalyze = content || '';
  let extractedTitle = '';

  if (type === 'link' && url) {
    const extracted = await extractLinkContent(url);
    textToAnalyze = extracted.content || extracted.description || extracted.title;
    extractedTitle = extracted.title;
  }

  const suggestion = await generateLibrarySuggestion({
    content: textToAnalyze,
    suggestedTitle: extractedTitle,
  });

  let creditsDeducted = 0;
  let creditsRemaining = req.user.wallet?.creditsRemaining ?? 0;

  if (suggestion.tokensUsed > 0) {
    try {
      const deduction = await deductCredits({
        userId: req.user._id,
        tokensUsed: suggestion.tokensUsed,
        feature: 'library',
        model: 'flash',
      });
      creditsDeducted = deduction.creditsDeducted;
      creditsRemaining = deduction.creditsRemaining;
    } catch (err) {
      logger.warn({ error: err.message }, 'Failed to deduct credits for library suggestion');
    }
  }

  res.status(200).json({
    data: {
      type,
      url: url || null,
      title: suggestion.title,
      summary: suggestion.summary,
      tags: suggestion.tags,
      content: textToAnalyze.slice(0, 3000),
      tokensUsed: suggestion.tokensUsed,
      creditsDeducted,
      creditsRemaining,
    },
  });
});

/**
 * Saves a confirmed library item and generates vector embedding.
 */
export const createItem = asyncHandler(async (req, res) => {
  const { type, url, title, summary, tags, content } = req.body;

  const normalizedTags = Array.isArray(tags)
    ? tags
        .map((t) =>
          t
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9-]/g, ''),
        )
        .filter(Boolean)
    : [];

  const item = await LibraryItem.create({
    userId: req.user._id,
    type,
    url: url || undefined,
    title: title.trim(),
    summary: summary?.trim() || '',
    tags: Array.from(new Set(normalizedTags)),
    content: content || '',
    vectorId: null,
  });

  // Vector embedding & upsert
  try {
    const embedText = `${item.title}\n\n${item.summary}\n\n${item.tags.join(' ')}\n\n${item.content ? item.content.slice(0, 1500) : ''}`;
    const embedding = await embedContent({ contents: embedText });

    if (embedding && embedding.length > 0) {
      const vectorId = item._id.toString();
      const success = await vectorDbService.upsert({
        id: vectorId,
        values: embedding,
        metadata: {
          userId: req.user._id.toString(),
          type: 'library',
          refId: vectorId,
        },
      });

      if (success) {
        item.vectorId = vectorId;
        await item.save();
      }
    }
  } catch (err) {
    logger.warn(
      { error: err.message, itemId: item._id },
      'Vector embedding failed during library item creation; item saved in MongoDB',
    );
  }

  res.status(201).json({
    data: item,
  });
});

/**
 * Lists library items for the authenticated user, optionally filtered by tag.
 */
export const listItems = asyncHandler(async (req, res) => {
  const { tag, page = 1, limit = 20 } = req.query;
  const filter = { userId: req.user._id };

  if (tag) {
    filter.tags = tag.toLowerCase().trim();
  }

  const numericPage = Math.max(1, parseInt(page, 10));
  const numericLimit = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (numericPage - 1) * numericLimit;

  const [items, total, allTags] = await Promise.all([
    LibraryItem.find(filter).sort({ createdAt: -1 }).skip(skip).limit(numericLimit).lean(),
    LibraryItem.countDocuments(filter),
    LibraryItem.distinct('tags', { userId: req.user._id }),
  ]);

  res.status(200).json({
    data: items,
    meta: {
      total,
      page: numericPage,
      limit: numericLimit,
      totalPages: Math.ceil(total / numericLimit) || 1,
      tags: allTags.filter(Boolean).sort(),
    },
  });
});

/**
 * Retrieves a single library item by ID.
 */
export const getItemById = asyncHandler(async (req, res) => {
  const item = await LibraryItem.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!item) {
    throw new ApiError(404, 'ITEM_NOT_FOUND', 'Library item not found');
  }

  res.status(200).json({
    data: item,
  });
});

/**
 * Updates a library item and refreshes its vector embedding.
 */
export const updateItem = asyncHandler(async (req, res) => {
  const item = await LibraryItem.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!item) {
    throw new ApiError(404, 'ITEM_NOT_FOUND', 'Library item not found');
  }

  const { title, summary, tags, content } = req.body;
  let textChanged = false;

  if (title !== undefined && title.trim() !== item.title) {
    item.title = title.trim();
    textChanged = true;
  }
  if (summary !== undefined && summary.trim() !== item.summary) {
    item.summary = summary.trim();
    textChanged = true;
  }
  if (tags !== undefined) {
    item.tags = Array.from(
      new Set(
        tags
          .map((t) =>
            t
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9-]/g, ''),
          )
          .filter(Boolean),
      ),
    );
    textChanged = true;
  }
  if (content !== undefined && content !== item.content) {
    item.content = content;
    textChanged = true;
  }

  await item.save();

  if (textChanged) {
    try {
      const embedText = `${item.title}\n\n${item.summary}\n\n${item.tags.join(' ')}\n\n${item.content ? item.content.slice(0, 1500) : ''}`;
      const embedding = await embedContent({ contents: embedText });

      if (embedding && embedding.length > 0) {
        const vectorId = item.vectorId || item._id.toString();
        await vectorDbService.upsert({
          id: vectorId,
          values: embedding,
          metadata: {
            userId: req.user._id.toString(),
            type: 'library',
            refId: item._id.toString(),
          },
        });
        if (!item.vectorId) {
          item.vectorId = vectorId;
          await item.save();
        }
      }
    } catch (err) {
      logger.warn({ error: err.message, itemId: item._id }, 'Vector re-embedding failed');
    }
  }

  res.status(200).json({
    data: item,
  });
});

/**
 * Deletes a library item and removes its vector index.
 */
export const deleteItem = asyncHandler(async (req, res) => {
  const item = await LibraryItem.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!item) {
    throw new ApiError(404, 'ITEM_NOT_FOUND', 'Library item not found');
  }

  if (item.vectorId) {
    try {
      await vectorDbService.remove(item.vectorId);
    } catch (err) {
      logger.warn({ error: err.message, vectorId: item.vectorId }, 'Failed to remove vector');
    }
  }

  await item.deleteOne();

  res.status(200).json({
    data: {
      message: 'Library item deleted successfully',
    },
  });
});

/**
 * Semantic search over library items for the authenticated user.
 * Searches by conceptual meaning via vector embeddings, with MongoDB text search ranking.
 */
export const searchItems = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const userIdStr = req.user._id.toString();

  let matchedItems = [];
  const matchedIds = new Set();

  // 1. Semantic Vector Search
  try {
    const queryEmbedding = await embedContent({ contents: q });
    if (queryEmbedding && queryEmbedding.length > 0) {
      const vectorMatches = await vectorDbService.query({
        values: queryEmbedding,
        topK: 20,
        filter: {
          userId: userIdStr,
          type: 'library',
        },
      });

      const refIds = vectorMatches.map((m) => m.metadata?.refId || m.id).filter(Boolean);

      if (refIds.length > 0) {
        const docs = await LibraryItem.find({
          _id: { $in: refIds },
          userId: req.user._id,
        }).lean();

        // Preserve vector similarity score ordering
        const docMap = new Map(docs.map((d) => [d._id.toString(), d]));
        for (const refId of refIds) {
          const doc = docMap.get(refId);
          if (doc && !matchedIds.has(doc._id.toString())) {
            matchedIds.add(doc._id.toString());
            matchedItems.push(doc);
          }
        }
      }
    }
  } catch (err) {
    logger.warn(
      { error: err.message, query: q },
      'Semantic vector query failed, using text fallback',
    );
  }

  // 2. Keyword & Text Search Fallback / Augmentation
  try {
    const textMatches = await LibraryItem.find({
      userId: req.user._id,
      $or: [
        { $text: { $search: q } },
        { title: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    for (const doc of textMatches) {
      if (!matchedIds.has(doc._id.toString())) {
        matchedIds.add(doc._id.toString());
        matchedItems.push(doc);
      }
    }
  } catch (textErr) {
    logger.warn({ error: textErr.message }, 'Text search fallback encountered an issue');
  }

  res.status(200).json({
    data: matchedItems,
  });
});
