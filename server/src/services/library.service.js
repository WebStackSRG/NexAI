import LibraryItem from "../models/LibraryItem.js";
import { getDbStatus } from "../config/db.js";
import { extractUrlContent } from "./extractor.service.js";
import { summarizeAndTag, generateEmbedding } from "./gemini.service.js";
import { upsertVector, deleteVector } from "./pinecone.service.js";

// In-memory dev cache for library items when MongoDB is offline
export const devLibraryMap = new Map();

/**
 * Stage 1: Save item (link or note) and generate AI summary + tags
 * Creates item with status: 'pending' (Suggest stage of lifecycle)
 */
export const saveItem = async (
  userId,
  { url = "", content = "", type = "link", title = "" } = {},
) => {
  let resolvedTitle = title ? title.trim() : "";
  let rawContent = content ? content.trim() : "";
  let resolvedUrl = url ? url.trim() : "";

  // If link, extract web page content
  if (type === "link" || (!type && url)) {
    type = "link";
    const extracted = await extractUrlContent(resolvedUrl);
    if (!resolvedTitle) resolvedTitle = extracted.title;
    rawContent = extracted.content;
    resolvedUrl = extracted.url;
  }

  if (!resolvedTitle) {
    resolvedTitle = rawContent.slice(0, 40) || "Untitled Note";
  }

  // Generate AI summary and tags (Suggest step)
  const aiSuggestions = await summarizeAndTag(rawContent, resolvedTitle);

  const itemData = {
    userId,
    type,
    title: resolvedTitle,
    url: resolvedUrl || undefined,
    content: rawContent,
    summary: aiSuggestions.summary,
    tags: aiSuggestions.tags || [],
    folder: "Uncategorized",
    pinned: false,
    status: "pending", // Awaiting user review & confirmation
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (getDbStatus().isConnected) {
    try {
      const created = await LibraryItem.create(itemData);
      return {
        item: created.toObject(),
        suggestions: aiSuggestions,
      };
    } catch (err) {
      console.warn("[LibraryService] MongoDB create failed, using dev cache:", err.message);
    }
  }

  // Dev fallback
  const mockId = `dev-lib-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const devItem = {
    _id: mockId,
    id: mockId,
    ...itemData,
    userId: userId.toString(),
  };
  devLibraryMap.set(mockId, devItem);

  return {
    item: devItem,
    suggestions: aiSuggestions,
  };
};

/**
 * Stage 2: Confirm & index item into vector database
 * Updates title, summary, tags, and commits status to 'confirmed'
 */
export const confirmItem = async (
  itemId,
  userId,
  { title, summary, tags, folder, pinned } = {},
) => {
  let currentItem = null;

  if (getDbStatus().isConnected) {
    try {
      currentItem = await LibraryItem.findOne({ _id: itemId, userId });
    } catch (err) {
      // Fallback
    }
  }

  if (!currentItem) {
    const devItem = devLibraryMap.get(itemId.toString());
    if (devItem && devItem.userId === userId.toString()) {
      currentItem = devItem;
    }
  }

  if (!currentItem) {
    return null;
  }

  // Apply reviewed fields
  if (title !== undefined) currentItem.title = title.trim();
  if (summary !== undefined) currentItem.summary = summary.trim();
  if (Array.isArray(tags)) currentItem.tags = tags;
  if (folder !== undefined) currentItem.folder = folder;
  if (pinned !== undefined) currentItem.pinned = pinned;

  currentItem.status = "confirmed";
  currentItem.updatedAt = new Date();

  // Generate vector embedding for RAG & semantic search
  const textToEmbed = `${currentItem.title}\n\n${currentItem.summary}\n\n${currentItem.content || ""}`;
  const embedding = await generateEmbedding(textToEmbed);

  const vectorId = `vec-${currentItem._id || currentItem.id}`;
  currentItem.vectorId = vectorId;

  // Upsert to Pinecone vector store
  await upsertVector({
    id: vectorId,
    values: embedding,
    metadata: {
      userId: userId.toString(),
      itemId: currentItem._id ? currentItem._id.toString() : currentItem.id,
      title: currentItem.title,
      type: currentItem.type,
      tags: (currentItem.tags || []).join(","),
    },
    namespace: "library",
  });

  if (getDbStatus().isConnected && typeof currentItem.save === "function") {
    try {
      await currentItem.save();
      return currentItem.toObject();
    } catch (err) {
      console.warn("[LibraryService] MongoDB save failed:", err.message);
    }
  }

  devLibraryMap.set(itemId.toString(), currentItem);
  return currentItem;
};

/**
 * List user library items with filtering and search
 */
export const getItems = async (
  userId,
  { type = "all", search = "", folder = "", status = "all" } = {},
) => {
  if (getDbStatus().isConnected) {
    try {
      const query = { userId };
      if (type && type !== "all") query.type = type;
      if (status && status !== "all") query.status = status;
      if (folder) query.folder = folder;
      if (search && search.trim()) {
        query.$or = [
          { title: { $regex: search.trim(), $options: "i" } },
          { summary: { $regex: search.trim(), $options: "i" } },
          { tags: { $in: [new RegExp(search.trim(), "i")] } },
        ];
      }

      return await LibraryItem.find(query)
        .sort({ pinned: -1, updatedAt: -1 })
        .lean();
    } catch (err) {
      console.warn("[LibraryService] MongoDB query failed, using dev cache:", err.message);
    }
  }

  // Dev fallback
  let items = Array.from(devLibraryMap.values()).filter(
    (item) => item.userId === userId.toString(),
  );

  if (type && type !== "all") {
    items = items.filter((i) => i.type === type);
  }
  if (status && status !== "all") {
    items = items.filter((i) => i.status === status);
  }
  if (folder) {
    items = items.filter((i) => i.folder === folder);
  }
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    items = items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        (i.summary && i.summary.toLowerCase().includes(q)) ||
        (i.tags && i.tags.some((t) => t.toLowerCase().includes(q))),
    );
  }

  items.sort((a, b) => {
    if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  return items;
};

/**
 * Delete a library item and its vector embedding
 */
export const deleteItem = async (itemId, userId) => {
  let vectorId = null;

  if (getDbStatus().isConnected) {
    try {
      const item = await LibraryItem.findOne({ _id: itemId, userId });
      if (item) {
        vectorId = item.vectorId;
        await LibraryItem.deleteOne({ _id: itemId });
        if (vectorId) {
          await deleteVector(vectorId, "library");
        }
        return true;
      }
    } catch (err) {
      // Fallback
    }
  }

  const devItem = devLibraryMap.get(itemId.toString());
  if (devItem && devItem.userId === userId.toString()) {
    if (devItem.vectorId) {
      await deleteVector(devItem.vectorId, "library");
    }
    devLibraryMap.delete(itemId.toString());
    return true;
  }

  return false;
};

