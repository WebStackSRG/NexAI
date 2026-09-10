import apiClient from "./apiClient";

/**
 * List all documents
 */
export const fetchDocuments = async () => {
  const res = await apiClient.get("/documents");
  return res.data.documents;
};

/**
 * Get single document by ID
 */
export const fetchDocumentById = async (id) => {
  const res = await apiClient.get(`/documents/${id}`);
  return res.data.document;
};

/**
 * Create new document
 */
export const createDocument = async (data) => {
  const res = await apiClient.post("/documents", data);
  return res.data.document;
};

/**
 * Update document title and sections
 */
export const updateDocument = async (id, data) => {
  const res = await apiClient.patch(`/documents/${id}`, data);
  return res.data.document;
};

/**
 * Delete document
 */
export const deleteDocument = async (id) => {
  const res = await apiClient.delete(`/documents/${id}`);
  return res.data;
};

/**
 * Generate structured sections using Gemini 2.5 Pro
 */
export const generateDocumentSections = async ({
  topic,
  tone = "technical",
  sectionCount = 4,
}) => {
  const res = await apiClient.post("/documents/generate", {
    topic,
    tone,
    sectionCount,
  });
  return res.data;
};

/**
 * Index document into Knowledge Library for RAG
 */
export const indexDocumentToLibrary = async (id) => {
  const res = await apiClient.post(`/documents/${id}/index-library`);
  return res.data;
};

