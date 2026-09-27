import { LibraryItem } from '../models/LibraryItem.js';
import { Prompt } from '../models/Prompt.js';
import { Chat } from '../models/Chat.js';
import { Message } from '../models/Message.js';
import { embedContent } from './gemini.service.js';
import { vectorDbService } from './vectorDb.service.js';
import { logger } from '../utils/logger.js';

/**
 * Escapes characters for regex matching.
 * @param {string} str
 * @returns {string}
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Searches the user's personal library using hybrid vector and text matching.
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {string} q
 * @param {number} [limit=20]
 * @returns {Promise<Array<object>>}
 */
export async function searchLibrary(userId, q, limit = 20) {
  const userIdStr = userId.toString();
  const matchedItems = [];
  const matchedIds = new Set();
  const escapedQ = escapeRegex(q);
  const regex = new RegExp(escapedQ, 'i');

  // 1. Semantic Vector Search
  try {
    const queryEmbedding = await embedContent({ contents: q });
    if (queryEmbedding && queryEmbedding.length > 0) {
      const vectorMatches = await vectorDbService.query({
        values: queryEmbedding,
        topK: limit,
        filter: {
          userId: userIdStr,
          type: 'library',
        },
      });

      const refIds = vectorMatches.map((m) => m.metadata?.refId || m.id).filter(Boolean);
      if (refIds.length > 0) {
        const docs = await LibraryItem.find({
          _id: { $in: refIds },
          userId,
        }).lean();

        const docMap = new Map(docs.map((d) => [d._id.toString(), d]));
        for (const match of vectorMatches) {
          const refId = match.metadata?.refId || match.id;
          const doc = docMap.get(refId);
          if (doc && !matchedIds.has(doc._id.toString())) {
            matchedIds.add(doc._id.toString());
            matchedItems.push({
              ...doc,
              similarityScore: match.score || 0,
              matchSource: 'vector',
            });
          }
        }
      }
    }
  } catch (err) {
    logger.warn(
      { error: err.message, query: q },
      'Vector query failed in unified search; continuing with text matching',
    );
  }

  // 2. Text / Regex matching fallback and augmentation
  try {
    const textFilter = {
      userId,
      $or: [
        { $text: { $search: q } },
        { title: regex },
        { summary: regex },
        { tags: { $in: [regex] } },
        { content: regex },
        { 'sections.heading': regex },
        { 'sections.body': regex },
      ],
    };

    const textMatches = await LibraryItem.find(textFilter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    for (const doc of textMatches) {
      const idStr = doc._id.toString();
      if (!matchedIds.has(idStr)) {
        matchedIds.add(idStr);
        matchedItems.push({
          ...doc,
          matchSource: 'text',
        });
      }
    }
  } catch (textErr) {
    logger.warn({ error: textErr.message }, 'Text search fallback encountered an issue in unified search');
    // If $text fails due to punctuation/stop words, try regex only
    try {
      const fallbackMatches = await LibraryItem.find({
        userId,
        $or: [
          { title: regex },
          { summary: regex },
          { tags: { $in: [regex] } },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      for (const doc of fallbackMatches) {
        const idStr = doc._id.toString();
        if (!matchedIds.has(idStr)) {
          matchedIds.add(idStr);
          matchedItems.push({
            ...doc,
            matchSource: 'regex',
          });
        }
      }
    } catch {
      // Ignore fallback error
    }
  }

  return matchedItems.slice(0, limit);
}

/**
 * Searches the user's prompt templates by title, description, template, and tags.
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {string} q
 * @param {number} [limit=20]
 * @returns {Promise<Array<object>>}
 */
export async function searchPrompts(userId, q, limit = 20) {
  const escapedQ = escapeRegex(q);
  const regex = new RegExp(escapedQ, 'i');

  try {
    const filter = {
      userId,
      $or: [
        { $text: { $search: q } },
        { title: regex },
        { description: regex },
        { template: regex },
        { tags: { $in: [regex] } },
      ],
    };

    return await Prompt.find(filter)
      .sort({ isFavorite: -1, createdAt: -1 })
      .limit(limit)
      .lean();
  } catch {
    // Fallback if $text index throws syntax error
    const fallbackFilter = {
      userId,
      $or: [
        { title: regex },
        { description: regex },
        { template: regex },
        { tags: { $in: [regex] } },
      ],
    };
    return await Prompt.find(fallbackFilter)
      .sort({ isFavorite: -1, createdAt: -1 })
      .limit(limit)
      .lean();
  }
}

/**
 * Searches the user's chat conversations and messages.
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {string} q
 * @param {number} [limit=20]
 * @returns {Promise<Array<object>>}
 */
export async function searchChats(userId, q, limit = 20) {
  const escapedQ = escapeRegex(q);
  const regex = new RegExp(escapedQ, 'i');

  const userChats = await Chat.find({ userId })
    .select('_id title pinned createdAt updatedAt')
    .lean();

  if (!userChats || userChats.length === 0) {
    return [];
  }

  const chatMap = new Map(userChats.map((c) => [c._id.toString(), c]));
  const userChatIds = userChats.map((c) => c._id);

  const matchedChats = [];
  const matchedChatIds = new Set();

  // 1. Direct Chat title matches
  for (const chat of userChats) {
    if (chat.title && regex.test(chat.title)) {
      matchedChatIds.add(chat._id.toString());
      matchedChats.push({
        _id: chat._id,
        chatId: chat._id,
        title: chat.title,
        pinned: chat.pinned || false,
        matchType: 'title',
        snippet: chat.title,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      });
    }
  }

  // 2. Chat message content matches
  try {
    const messageMatches = await Message.find({
      chatId: { $in: userChatIds },
      content: regex,
    })
      .sort({ createdAt: -1 })
      .limit(limit * 2)
      .lean();

    for (const msg of messageMatches) {
      const cId = msg.chatId.toString();
      const chat = chatMap.get(cId);
      if (!chat) continue;

      const content = msg.content || '';
      const matchIndex = content.toLowerCase().indexOf(q.toLowerCase());
      let snippet = '';
      if (matchIndex !== -1) {
        const start = Math.max(0, matchIndex - 50);
        const end = Math.min(content.length, matchIndex + q.length + 70);
        snippet = `${start > 0 ? '...' : ''}${content.slice(start, end).trim()}${end < content.length ? '...' : ''}`;
      } else {
        snippet = content.slice(0, 120);
      }

      if (!matchedChatIds.has(cId)) {
        matchedChatIds.add(cId);
        matchedChats.push({
          _id: msg._id,
          chatId: chat._id,
          title: chat.title,
          pinned: chat.pinned || false,
          matchType: 'message',
          role: msg.role,
          snippet,
          createdAt: msg.createdAt,
          updatedAt: chat.updatedAt,
        });
      }
    }
  } catch (err) {
    logger.warn({ error: err.message }, 'Message content search failed');
  }

  return matchedChats.slice(0, limit);
}

/**
 * Unified hybrid search across Personal Library, Prompt Vault, and Chat History.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {object} params
 * @param {string} params.q
 * @param {'all'|'library'|'prompts'|'chats'} [params.type='all']
 * @param {number} [params.limit=20]
 * @returns {Promise<object>}
 */
export async function unifiedSearch(userId, { q, type = 'all', limit = 20 }) {
  const trimmedQ = (q || '').trim();
  if (!trimmedQ) {
    return {
      query: '',
      type,
      counts: { total: 0, library: 0, prompts: 0, chats: 0 },
      library: [],
      prompts: [],
      chats: [],
    };
  }

  let library = [];
  let prompts = [];
  let chats = [];

  if (type === 'all' || type === 'library') {
    library = await searchLibrary(userId, trimmedQ, limit);
  }
  if (type === 'all' || type === 'prompts') {
    prompts = await searchPrompts(userId, trimmedQ, limit);
  }
  if (type === 'all' || type === 'chats') {
    chats = await searchChats(userId, trimmedQ, limit);
  }

  const counts = {
    total: library.length + prompts.length + chats.length,
    library: library.length,
    prompts: prompts.length,
    chats: chats.length,
  };

  return {
    query: trimmedQ,
    type,
    counts,
    library,
    prompts,
    chats,
  };
}
