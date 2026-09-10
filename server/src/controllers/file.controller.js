import { analyzeUploadedFile } from "../services/fileAnalysis.service.js";
import LibraryItem from "../models/LibraryItem.js";
import { getDbStatus } from "../config/db.js";
import { generateEmbedding } from "../services/gemini.service.js";
import { upsertVector } from "../services/pinecone.service.js";
import { devLibraryMap } from "../services/library.service.js";

/**
 * POST /library/upload — Upload and analyze multimodal files
 */
export const uploadFile = async (req, res, next) => {
  try {
    const { filename, mimeType, dataBase64 } = req.body;
    const userId = req.user._id;

    // 1. Perform Gemini Multimodal OCR and summary analysis
    const analysis = await analyzeUploadedFile({
      filename,
      mimeType,
      dataBase64,
    });

    // 2. Generate vector embedding for Pinecone Starter
    const textToEmbed = `${filename}\n\n${analysis.summary}\n\n${analysis.extractedText}`;
    const embedding = await generateEmbedding(textToEmbed);

    const mockId = `file-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const vectorId = `vec-${mockId}`;

    await upsertVector({
      id: vectorId,
      values: embedding,
      metadata: {
        userId: userId.toString(),
        title: filename,
        type: "file",
        summary: analysis.summary,
        tags: (analysis.tags || []).join(","),
      },
      namespace: "library",
    });

    let savedItem = null;

    if (getDbStatus().isConnected) {
      try {
        savedItem = await LibraryItem.create({
          userId,
          type: "file",
          title: filename,
          content: analysis.extractedText,
          summary: analysis.summary,
          mimeType,
          tags: analysis.tags,
          vectorId,
          status: "confirmed",
        });
        savedItem = savedItem.toObject();
      } catch (err) {
        console.warn("[FileController] Mongo create failed:", err.message);
      }
    }

    if (!savedItem) {
      savedItem = {
        _id: mockId,
        id: mockId,
        userId: userId.toString(),
        type: "file",
        title: filename,
        content: analysis.extractedText,
        summary: analysis.summary,
        mimeType,
        tags: analysis.tags,
        vectorId,
        status: "confirmed",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      devLibraryMap.set(mockId, savedItem);
    }

    return res.status(201).json({
      message: "File analyzed, indexed, and saved to library successfully",
      item: savedItem,
    });
  } catch (err) {
    next(err);
  }
};
