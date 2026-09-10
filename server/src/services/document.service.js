import Document from "../models/Document.js";
import LibraryItem from "../models/LibraryItem.js";
import { getDbStatus } from "../config/db.js";
import { generateEmbedding } from "./gemini.service.js";
import { upsertVector, deleteVector } from "./pinecone.service.js";

// In-memory dev storage fallback for documents
const devDocumentsMap = new Map();

/**
 * List documents for user
 */
export const getUserDocuments = async (userId) => {
  const uId = userId.toString();
  if (getDbStatus().isConnected) {
    try {
      return await Document.find({ userId })
        .sort({ updatedAt: -1 })
        .lean();
    } catch (err) {
      console.warn("[DocumentService] Mongo find failed:", err.message);
    }
  }

  return Array.from(devDocumentsMap.values())
    .filter((d) => d.userId === uId)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
};

/**
 * Get document by ID with user security boundary
 */
export const getDocumentById = async (documentId, userId) => {
  const uId = userId.toString();
  if (getDbStatus().isConnected) {
    try {
      const doc = await Document.findOne({ _id: documentId, userId }).lean();
      if (doc) return doc;
    } catch (err) {
      // Fall through to dev map
    }
  }

  const doc = devDocumentsMap.get(documentId);
  if (doc && doc.userId === uId) {
    return doc;
  }
  return null;
};

/**
 * Create new document
 */
export const createDocument = async (userId, { title, sections = [] }) => {
  const uId = userId.toString();

  const formattedSections = sections.map((s, idx) => ({
    heading: s.heading || "",
    body: s.body || "",
    imageUrl: s.imageUrl || "",
    order: typeof s.order === "number" ? s.order : idx,
  }));

  if (getDbStatus().isConnected) {
    try {
      const doc = new Document({
        userId,
        title,
        sections: formattedSections,
        versionHistory: [
          {
            sections: formattedSections,
            savedAt: new Date(),
            label: "Initial Version",
          },
        ],
      });
      await doc.save();
      return doc.toObject();
    } catch (err) {
      console.warn("[DocumentService] Mongo save failed:", err.message);
    }
  }

  const mockId = `dev-doc-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const newDoc = {
    _id: mockId,
    id: mockId,
    userId: uId,
    title,
    sections: formattedSections.map((s, idx) => ({
      _id: `sec-${idx}-${Date.now()}`,
      ...s,
    })),
    versionHistory: [
      {
        sections: formattedSections,
        savedAt: new Date(),
        label: "Initial Version",
      },
    ],
    exportFormats: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  devDocumentsMap.set(mockId, newDoc);
  return newDoc;
};

/**
 * Update document and sections
 */
export const updateDocument = async (
  documentId,
  userId,
  { title, sections, exportFormat },
) => {
  const uId = userId.toString();

  if (getDbStatus().isConnected) {
    try {
      const existing = await Document.findOne({ _id: documentId, userId });
      if (existing) {
        if (title !== undefined) existing.title = title;
        if (sections !== undefined) {
          existing.versionHistory.unshift({
            sections: existing.sections,
            savedAt: new Date(),
            label: `Revision at ${new Date().toLocaleTimeString()}`,
          });
          if (existing.versionHistory.length > 10) {
            existing.versionHistory = existing.versionHistory.slice(0, 10);
          }
          existing.sections = sections;
        }
        if (exportFormat && !existing.exportFormats.includes(exportFormat)) {
          existing.exportFormats.push(exportFormat);
        }
        existing.updatedAt = new Date();
        await existing.save();
        return existing.toObject();
      }
    } catch (err) {
      console.warn("[DocumentService] Mongo update failed:", err.message);
    }
  }

  const doc = devDocumentsMap.get(documentId);
  if (doc && doc.userId === uId) {
    if (title !== undefined) doc.title = title;
    if (sections !== undefined) {
      doc.versionHistory = doc.versionHistory || [];
      doc.versionHistory.unshift({
        sections: doc.sections,
        savedAt: new Date(),
        label: `Revision at ${new Date().toLocaleTimeString()}`,
      });
      if (doc.versionHistory.length > 10) {
        doc.versionHistory = doc.versionHistory.slice(0, 10);
      }
      doc.sections = sections;
    }
    if (exportFormat && !doc.exportFormats.includes(exportFormat)) {
      doc.exportFormats.push(exportFormat);
    }
    doc.updatedAt = new Date();
    return doc;
  }

  return null;
};

/**
 * Delete document
 */
export const deleteDocument = async (documentId, userId) => {
  const uId = userId.toString();

  if (getDbStatus().isConnected) {
    try {
      const res = await Document.deleteOne({ _id: documentId, userId });
      return res.deletedCount > 0;
    } catch (err) {
      console.warn("[DocumentService] Mongo delete failed:", err.message);
    }
  }

  const doc = devDocumentsMap.get(documentId);
  if (doc && doc.userId === uId) {
    devDocumentsMap.delete(documentId);
    return true;
  }
  return false;
};

/**
 * Index completed document into Knowledge Library for RAG search
 */
export const indexDocumentIntoLibrary = async (documentId, userId) => {
  const doc = await getDocumentById(documentId, userId);
  if (!doc) {
    throw new Error("Document not found");
  }

  const fullContent = (doc.sections || [])
    .map((s) => `${s.heading}\n${s.body.replace(/<[^>]*>?/gm, "")}`)
    .join("\n\n");

  let libraryItem = null;
  const vectorId = `doc-${doc._id ? doc._id.toString() : doc.id}`;
  const textToEmbed = `${doc.title}\n\n${fullContent}`;
  const embedding = await generateEmbedding(textToEmbed);

  await upsertVector({
    id: vectorId,
    values: embedding,
    metadata: {
      userId: userId.toString(),
      title: doc.title,
      type: "document",
      summary:
        doc.sections?.[0]?.body?.replace(/<[^>]*>?/gm, "").slice(0, 300) ||
        doc.title,
    },
    namespace: "library",
  });

  if (getDbStatus().isConnected) {
    try {
      libraryItem = await LibraryItem.findOneAndUpdate(
        { userId, _id: doc.libraryItemId },
        {
          $set: {
            userId,
            type: "document",
            title: doc.title,
            content: fullContent,
            summary:
              doc.sections?.[0]?.body?.replace(/<[^>]*>?/gm, "").slice(0, 300) ||
              doc.title,
            tags: ["document", "generated-report"],
            vectorId,
            status: "confirmed",
            updatedAt: new Date(),
          },
        },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
      );

      await Document.findByIdAndUpdate(documentId, {
        $set: { libraryItemId: libraryItem._id },
      });

      return { libraryItemId: libraryItem._id, vectorId };
    } catch (err) {
      console.warn("[DocumentService] Mongo indexDocument failed:", err.message);
    }
  }

  doc.libraryItemId = `lib-item-${doc._id || doc.id}`;
  return { libraryItemId: doc.libraryItemId, vectorId };
};

