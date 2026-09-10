import { getDbStatus } from "../config/db.js";
import { generateEmbedding } from "./gemini.service.js";
import { queryVectors } from "./pinecone.service.js";
import LibraryItem from "../models/LibraryItem.js";
import Document from "../models/Document.js";
import Prompt from "../models/Prompt.js";
import Chat from "../models/Chat.js";
import { getItems as getUserLibrary } from "./library.service.js";
import { getUserDocuments } from "./document.service.js";
import { getUserPrompts } from "./prompt.service.js";
import { getUserChats } from "./chat.service.js";

/**
 * Execute unified parallel search across Pinecone vectors, library, documents, prompts, and chats
 */
export const executeUnifiedSearch = async (userId, queryText, limit = 5) => {
  const cleanQ = (queryText || "").trim();
  const uId = userId.toString();

  if (!cleanQ) {
    return {
      query: "",
      total: 0,
      results: {
        semantic: [],
        library: [],
        documents: [],
        prompts: [],
        chats: [],
      },
    };
  }

  // 1. Semantic Vector Search via Pinecone
  const semanticPromise = (async () => {
    try {
      const embedding = await generateEmbedding(cleanQ);
      const matches = await queryVectors({
        vector: embedding,
        topK: limit,
        namespace: "library",
        filter: { userId: uId },
      });
      return matches.map((m) => ({
        id: m.id,
        score: Math.round((m.score || 0) * 100),
        title: m.metadata.title || "Semantic Match",
        summary: m.metadata.summary || "",
        type: m.metadata.type || "library",
      }));
    } catch (err) {
      console.warn("[SearchService] Semantic search warning:", err.message);
      return [];
    }
  })();

  // 2. Library Items Search
  const libraryPromise = (async () => {
    try {
      if (getDbStatus().isConnected) {
        return await LibraryItem.find({
          userId,
          status: "confirmed",
          $or: [
            { title: { $regex: cleanQ, $options: "i" } },
            { summary: { $regex: cleanQ, $options: "i" } },
            { tags: { $regex: cleanQ, $options: "i" } },
          ],
        })
          .limit(limit)
          .lean();
      }
      const all = await getUserLibrary(userId);
      const q = cleanQ.toLowerCase();
      return (all || [])
        .filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            (item.summary && item.summary.toLowerCase().includes(q)) ||
            (item.tags && item.tags.some((t) => t.toLowerCase().includes(q))),
        )
        .slice(0, limit);
    } catch (err) {
      return [];
    }
  })();

  // 3. Document Studio Search
  const documentPromise = (async () => {
    try {
      if (getDbStatus().isConnected) {
        return await Document.find({
          userId,
          $or: [
            { title: { $regex: cleanQ, $options: "i" } },
            { "sections.heading": { $regex: cleanQ, $options: "i" } },
          ],
        })
          .limit(limit)
          .lean();
      }
      const all = await getUserDocuments(userId);
      const q = cleanQ.toLowerCase();
      return (all || [])
        .filter(
          (doc) =>
            doc.title.toLowerCase().includes(q) ||
            (doc.sections &&
              doc.sections.some((s) => s.heading.toLowerCase().includes(q))),
        )
        .slice(0, limit);
    } catch (err) {
      return [];
    }
  })();

  // 4. Prompt Vault Search
  const promptPromise = (async () => {
    try {
      if (getDbStatus().isConnected) {
        return await Prompt.find({
          userId,
          $or: [
            { title: { $regex: cleanQ, $options: "i" } },
            { template: { $regex: cleanQ, $options: "i" } },
            { tags: { $regex: cleanQ, $options: "i" } },
          ],
        })
          .limit(limit)
          .lean();
      }
      const all = await getUserPrompts(userId, { search: cleanQ });
      return (all || []).slice(0, limit);
    } catch (err) {
      return [];
    }
  })();

  // 5. Chat History Search
  const chatPromise = (async () => {
    try {
      if (getDbStatus().isConnected) {
        return await Chat.find({
          userId,
          title: { $regex: cleanQ, $options: "i" },
        })
          .limit(limit)
          .lean();
      }
      const all = await getUserChats(userId);
      const q = cleanQ.toLowerCase();
      return (all || [])
        .filter((c) => c.title.toLowerCase().includes(q))
        .slice(0, limit);
    } catch (err) {
      return [];
    }
  })();

  // Await all parallel searches
  const [semantic, library, documents, prompts, chats] = await Promise.all([
    semanticPromise,
    libraryPromise,
    documentPromise,
    promptPromise,
    chatPromise,
  ]);

  const total =
    semantic.length +
    library.length +
    documents.length +
    prompts.length +
    chats.length;

  return {
    query: cleanQ,
    total,
    results: {
      semantic,
      library,
      documents,
      prompts,
      chats,
    },
  };
};
