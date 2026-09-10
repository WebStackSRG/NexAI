import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { generateEmbedding } from "../services/gemini.service.js";
import { queryVectors } from "../services/pinecone.service.js";
import * as libraryService from "../services/library.service.js";

/**
 * State Annotation for the LangGraph RAG workflow
 */
export const RagStateAnnotation = Annotation.Root({
  userId: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  query: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  sources: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  contextString: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
});

/**
 * Node 1: Retrieve relevant vector embeddings from Pinecone
 */
const retrieveNode = async (state) => {
  const { userId, query } = state;
  if (!query || !query.trim() || !userId) {
    return { sources: [] };
  }

  try {
    // 1. Generate query embedding vector (768 dimensions)
    const queryVector = await generateEmbedding(query);

    // 2. Query Pinecone library namespace with user filter
    const matches = await queryVectors({
      vector: queryVector,
      topK: 3,
      namespace: "library",
      filter: { userId: userId.toString() },
    });

    if (!matches || matches.length === 0) {
      return { sources: [] };
    }

    // 3. Format and enrich retrieved sources
    const sources = matches.map((m) => {
      const meta = m.metadata || {};
      return {
        id: meta.itemId || m.id,
        title: meta.title || "Knowledge Document",
        type: meta.type || "note",
        score: Math.min(Math.round((m.score || 0.75) * 100), 100),
        snippet: meta.summary || meta.content?.slice(0, 240) || meta.title || "",
        tags: meta.tags ? meta.tags.split(",").filter(Boolean) : [],
      };
    });

    return { sources };
  } catch (err) {
    console.warn("[RagAgent] Retrieval error, proceeding without RAG context:", err.message);
    return { sources: [] };
  }
};

/**
 * Node 2: Format context injection block for Gemini
 */
const formatContextNode = (state) => {
  const { sources } = state;
  if (!sources || sources.length === 0) {
    return { contextString: "" };
  }

  const sections = sources.map((s, index) => {
    return `[Source ${index + 1}]: "${s.title}" (Relevance: ${s.score}%)\nContent: ${s.snippet}`;
  });

  const contextBlock = `\n\n---
[GROUNDED KNOWLEDGE RETRIEVED FROM USER LIBRARY]:
${sections.join("\n\n")}
---
INSTRUCTION FOR AI: When relevant, use the facts from the retrieved knowledge sources above to answer the user's question accurately. If citing them, refer to their titles naturally.`;

  return { contextString: contextBlock };
};

// Build StateGraph
const workflow = new StateGraph(RagStateAnnotation)
  .addNode("retrieve", retrieveNode)
  .addNode("formatContext", formatContextNode)
  .addEdge(START, "retrieve")
  .addEdge("retrieve", "formatContext")
  .addEdge("formatContext", END);

export const ragGraph = workflow.compile();

/**
 * Execute the RAG pipeline for a given user query
 */
export const executeRagPipeline = async ({ userId, query }) => {
  try {
    const result = await ragGraph.invoke({
      userId: userId.toString(),
      query: query.trim(),
    });

    return {
      sources: result.sources || [],
      contextString: result.contextString || "",
    };
  } catch (err) {
    console.error("[RagAgent] Graph execution failed:", err.message);
    return { sources: [], contextString: "" };
  }
};

