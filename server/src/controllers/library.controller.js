import { LibraryItem } from '../models/LibraryItem.js';
import { extractLinkContent } from '../services/linkExtractor.service.js';
import { generateLibrarySuggestion } from '../agents/tagging.agent.js';
import { generateDocumentDraft } from '../agents/docGen.agent.js';
import { generateDocumentPdf } from '../services/pdfExport.service.js';
import { deductCredits } from '../services/credit.service.js';
import * as geminiService from '../services/gemini.service.js';
import { vectorDbService } from '../services/vectorDb.service.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logger } from '../utils/logger.js';

/**
 * Builds text representation of any polymorphic library item for vector embedding.
 *
 * @param {any} item
 * @returns {string}
 */
function buildItemEmbeddingText(item) {
  const parts = [item.title || '', item.summary || '', (item.tags || []).join(' ')];

  if (item.content) {
    parts.push(item.content.slice(0, 1500));
  }

  if (Array.isArray(item.sections) && item.sections.length > 0) {
    const sectionsText = item.sections
      .map((s) => `${s.heading}\n${s.body}`)
      .join('\n\n')
      .slice(0, 2000);
    parts.push(sectionsText);
  }

  if (item.topic || item.role) {
    parts.push(`Topic: ${item.topic || ''} Role: ${item.role || ''}`);
  }

  if (item.scorecard?.summary) {
    parts.push(`Scorecard: ${item.scorecard.summary}`);
  }

  return parts.filter(Boolean).join('\n\n');
}

/**
 * Generates an AI-suggested title, summary, and tags for a link, note, or file without saving.
 * Metered via creditCheck and credit deduction.
 */
export const suggestItem = asyncHandler(async (req, res) => {
  const { type, url, content, fileName } = req.body;
  let textToAnalyze = content || '';
  let extractedTitle = fileName || '';

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
 * Generates an AI-drafted structured document (resume, report, spec, study notes).
 * Returns draft without auto-saving (Suggest -> Review -> Confirm).
 * Metered via creditCheck and credit deduction.
 * POST /api/library/documents/generate
 */
export const generateDocument = asyncHandler(async (req, res) => {
  const { prompt, category = 'other' } = req.body;

  const draft = await generateDocumentDraft({ prompt, category });

  let creditsDeducted = 0;
  let creditsRemaining = req.user.wallet?.creditsRemaining ?? 0;

  if (draft.tokensUsed > 0) {
    try {
      const deduction = await deductCredits({
        userId: req.user._id,
        tokensUsed: draft.tokensUsed,
        feature: 'document',
        model: 'flash',
      });
      creditsDeducted = deduction.creditsDeducted;
      creditsRemaining = deduction.creditsRemaining;
    } catch (err) {
      logger.warn({ error: err.message }, 'Failed to deduct credits for document generation');
    }
  }

  res.status(200).json({
    data: {
      title: draft.title,
      category: draft.category,
      summary: draft.summary,
      sections: draft.sections,
      tokensUsed: draft.tokensUsed,
      creditsDeducted,
      creditsRemaining,
    },
  });
});

/**
 * Streams a styled PDF generated server-side using pdf-lib.
 * GET /api/library/documents/:id/export.pdf
 */
export const exportDocumentPdf = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const item = await LibraryItem.findOne({
    _id: id,
    userId: req.user._id,
  });

  if (!item) {
    throw new ApiError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
  }

  // Build document payload for PDF renderer
  const docPayload = {
    title: item.title,
    category: item.category || (item.type === 'document' ? 'Document' : item.type),
    summary: item.summary || '',
    sections:
      Array.isArray(item.sections) && item.sections.length > 0
        ? item.sections
        : [
            {
              heading: 'Content',
              body: item.content || item.summary || 'No content provided.',
            },
          ],
    createdAt: item.createdAt,
  };

  const pdfBuffer = await generateDocumentPdf(docPayload);
  const sanitizedTitle = (item.title || 'document')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 50);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${sanitizedTitle}.pdf"`);
  res.setHeader('Content-Length', pdfBuffer.length);
  res.status(200).send(pdfBuffer);
});

/**
 * Saves a confirmed polymorphic library item (link, note, document, file, interview).
 * POST /api/library
 */
export const createItem = asyncHandler(async (req, res) => {
  const {
    type,
    title,
    summary,
    tags,
    content,
    url,
    category,
    sections,
    fileFormat,
    fileName,
    mimeType,
    size,
    scorecard,
    transcript,
    topic,
    difficulty,
    role,
  } = req.body;

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
    title: title.trim(),
    summary: summary?.trim() || '',
    tags: Array.from(new Set(normalizedTags)),
    content: content || '',
    url: url || undefined,
    category: category || 'other',
    sections: Array.isArray(sections) ? sections : [],
    fileFormat: fileFormat || 'pdf',
    fileName: fileName || '',
    mimeType: mimeType || '',
    size: size || 0,
    scorecard: scorecard || null,
    transcript: Array.isArray(transcript) ? transcript : [],
    topic: topic || '',
    difficulty: difficulty || '',
    role: role || '',
    vectorId: null,
  });

  // Vector embedding & upsert
  try {
    const embedText = buildItemEmbeddingText(item);
    const embedding = await geminiService.embedContent({ contents: embedText });

    if (embedding && embedding.length > 0) {
      const vectorId = item._id.toString();
      const success = await vectorDbService.upsert({
        id: vectorId,
        values: embedding,
        metadata: {
          userId: req.user._id.toString(),
          type: 'library',
          itemType: item.type,
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
 * Lists library items with tabbed filtering: 'all', 'notes_links', 'documents', 'files', 'interviews'.
 * GET /api/library
 */
export const listItems = asyncHandler(async (req, res) => {
  const { tag, type, tab, page = 1, limit = 20 } = req.query;
  const filter = { userId: req.user._id };

  // Handle tabbed filtering
  if (tab) {
    if (tab === 'notes_links') {
      filter.type = { $in: ['link', 'note'] };
    } else if (tab === 'documents') {
      filter.type = 'document';
    } else if (tab === 'files') {
      filter.type = 'file';
    } else if (tab === 'interviews') {
      filter.type = 'interview';
    }
  } else if (type) {
    filter.type = type;
  }

  if (tag) {
    filter.tags = tag.toLowerCase().trim();
  }

  const numericPage = Math.max(1, parseInt(page, 10));
  const numericLimit = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (numericPage - 1) * numericLimit;

  // Run queries in parallel: items, total count, distinct tags, and tab breakdown counts
  const [items, total, allTags, countAll, countNotes, countDocs, countFiles, countInterviews] =
    await Promise.all([
      LibraryItem.find(filter).sort({ createdAt: -1 }).skip(skip).limit(numericLimit).lean(),
      LibraryItem.countDocuments(filter),
      LibraryItem.distinct('tags', { userId: req.user._id }),
      LibraryItem.countDocuments({ userId: req.user._id }),
      LibraryItem.countDocuments({ userId: req.user._id, type: { $in: ['link', 'note'] } }),
      LibraryItem.countDocuments({ userId: req.user._id, type: 'document' }),
      LibraryItem.countDocuments({ userId: req.user._id, type: 'file' }),
      LibraryItem.countDocuments({ userId: req.user._id, type: 'interview' }),
    ]);

  res.status(200).json({
    data: items,
    meta: {
      total,
      page: numericPage,
      limit: numericLimit,
      totalPages: Math.ceil(total / numericLimit) || 1,
      tags: allTags.filter(Boolean).sort(),
      counts: {
        all: countAll,
        notes_links: countNotes,
        documents: countDocs,
        files: countFiles,
        interviews: countInterviews,
      },
    },
  });
});

/**
 * Retrieves a single library item by ID.
 * GET /api/library/:id
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
 * Updates a polymorphic library item and refreshes its vector embedding.
 * PATCH /api/library/:id
 */
export const updateItem = asyncHandler(async (req, res) => {
  const item = await LibraryItem.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!item) {
    throw new ApiError(404, 'ITEM_NOT_FOUND', 'Library item not found');
  }

  const { title, summary, tags, content, category, sections } = req.body;
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
  if (category !== undefined && category !== item.category) {
    item.category = category;
    textChanged = true;
  }
  if (sections !== undefined) {
    item.sections = sections;
    textChanged = true;
  }

  await item.save();

  if (textChanged) {
    try {
      const embedText = buildItemEmbeddingText(item);
      const embedding = await geminiService.embedContent({ contents: embedText });

      if (embedding && embedding.length > 0) {
        const vectorId = item.vectorId || item._id.toString();
        await vectorDbService.upsert({
          id: vectorId,
          values: embedding,
          metadata: {
            userId: req.user._id.toString(),
            type: 'library',
            itemType: item.type,
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
 * DELETE /api/library/:id
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
 * Semantic search over polymorphic library items for the authenticated user.
 * Searches by conceptual meaning via vector embeddings, with MongoDB text search ranking.
 * GET /api/library/search?q=
 */
export const searchItems = asyncHandler(async (req, res) => {
  const { q, type } = req.query;
  const userIdStr = req.user._id.toString();

  let matchedItems = [];
  const matchedIds = new Set();

  // 1. Semantic Vector Search
  try {
    const queryEmbedding = await geminiService.embedContent({ contents: q });
    if (queryEmbedding && queryEmbedding.length > 0) {
      const vectorMatches = await vectorDbService.query({
        values: queryEmbedding,
        topK: 25,
        filter: {
          userId: userIdStr,
          type: 'library',
        },
      });

      const refIds = vectorMatches.map((m) => m.metadata?.refId || m.id).filter(Boolean);

      if (refIds.length > 0) {
        const queryFilter = {
          _id: { $in: refIds },
          userId: req.user._id,
        };
        if (type) queryFilter.type = type;

        const docs = await LibraryItem.find(queryFilter).lean();

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
    const textFilter = {
      userId: req.user._id,
      $or: [
        { $text: { $search: q } },
        { title: { $regex: q, $options: 'i' } },
        { summary: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } },
        { 'sections.heading': { $regex: q, $options: 'i' } },
        { 'sections.body': { $regex: q, $options: 'i' } },
      ],
    };
    if (type) textFilter.type = type;

    const textMatches = await LibraryItem.find(textFilter)
      .sort({ createdAt: -1 })
      .limit(25)
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
