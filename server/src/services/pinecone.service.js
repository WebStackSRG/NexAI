import { Pinecone } from "@pinecone-database/pinecone";
import { config } from "../config/env.js";

let pineconeClient = null;

const getPineconeClient = () => {
  if (pineconeClient) return pineconeClient;
  const apiKey = config.ai.pineconeApiKey || process.env.PINECONE_API_KEY;
  if (!apiKey || apiKey === "your-pinecone-api-key") {
    return null;
  }

  pineconeClient = new Pinecone({ apiKey });
  return pineconeClient;
};

// In-memory mock vector database for offline/development environments
const mockVectorStore = new Map(); // id -> { id, values, metadata, namespace }

const cosineSimilarity = (vecA, vecB) => {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Upsert a single vector record
 */
export const upsertVector = async ({
  id,
  values,
  metadata = {},
  namespace = "library",
}) => {
  const pc = getPineconeClient();
  const indexName = config.ai.pineconeIndexName || "nexai-library";

  if (pc) {
    try {
      const index = pc.index(indexName).namespace(namespace);
      await index.upsert([
        {
          id,
          values,
          metadata,
        },
      ]);
      return true;
    } catch (err) {
      console.warn("[PineconeService] Upsert error, falling back to mock:", err.message);
    }
  }

  // Dev fallback store
  mockVectorStore.set(id, { id, values, metadata, namespace });
  return true;
};

/**
 * Query top-k nearest vectors
 */
export const queryVectors = async ({
  vector,
  topK = 3,
  namespace = "library",
  filter = {},
}) => {
  const pc = getPineconeClient();
  const indexName = config.ai.pineconeIndexName || "nexai-library";

  if (pc) {
    try {
      const index = pc.index(indexName).namespace(namespace);
      const queryResponse = await index.query({
        vector,
        topK,
        includeMetadata: true,
        filter: Object.keys(filter).length > 0 ? filter : undefined,
      });

      return (queryResponse.matches || []).map((m) => ({
        id: m.id,
        score: m.score,
        metadata: m.metadata || {},
      }));
    } catch (err) {
      console.warn("[PineconeService] Query error, falling back to mock:", err.message);
    }
  }

  // Dev fallback: in-memory cosine similarity search
  const candidates = [];
  for (const item of mockVectorStore.values()) {
    if (item.namespace !== namespace) continue;

    // Apply metadata filters if specified
    let match = true;
    for (const [key, val] of Object.entries(filter)) {
      if (item.metadata[key] !== val) {
        match = false;
        break;
      }
    }
    if (!match) continue;

    const score = cosineSimilarity(vector, item.values);
    candidates.push({
      id: item.id,
      score,
      metadata: item.metadata,
    });
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, topK);
};

/**
 * Delete a vector by ID
 */
export const deleteVector = async (id, namespace = "library") => {
  const pc = getPineconeClient();
  const indexName = config.ai.pineconeIndexName || "nexai-library";

  if (pc) {
    try {
      const index = pc.index(indexName).namespace(namespace);
      await index.deleteOne(id);
      return true;
    } catch (err) {
      console.warn("[PineconeService] Delete error:", err.message);
    }
  }

  mockVectorStore.delete(id);
  return true;
};
