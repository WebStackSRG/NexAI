import * as documentService from "../services/document.service.js";
import { generateDocumentSections } from "../services/gemini.service.js";

/**
 * GET /documents — List user documents
 */
export const listDocuments = async (req, res, next) => {
  try {
    const documents = await documentService.getUserDocuments(req.user._id);
    return res.json({ documents });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /documents — Create a new document
 */
export const createDocument = async (req, res, next) => {
  try {
    const document = await documentService.createDocument(
      req.user._id,
      req.body,
    );
    return res.status(201).json({ document });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /documents/:id — Get document by ID
 */
export const getDocument = async (req, res, next) => {
  try {
    const document = await documentService.getDocumentById(
      req.params.id,
      req.user._id,
    );
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }
    return res.json({ document });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /documents/:id — Update document title, sections, exportFormat
 */
export const updateDocument = async (req, res, next) => {
  try {
    const document = await documentService.updateDocument(
      req.params.id,
      req.user._id,
      req.body,
    );
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }
    return res.json({ document });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /documents/:id — Remove document
 */
export const deleteDocument = async (req, res, next) => {
  try {
    const success = await documentService.deleteDocument(
      req.params.id,
      req.user._id,
    );
    if (!success) {
      return res.status(404).json({ error: "Document not found" });
    }
    return res.json({ message: "Document deleted successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /documents/generate — Generate structured sections using Gemini 2.5 Pro
 */
export const generateSections = async (req, res, next) => {
  try {
    const { topic, tone, sectionCount } = req.body;
    const generated = await generateDocumentSections({
      topic,
      tone,
      sectionCount,
    });
    return res.json({
      title: generated.title,
      sections: generated.sections,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /documents/:id/index-library — Sync document into Knowledge Library
 */
export const indexToLibrary = async (req, res, next) => {
  try {
    const result = await documentService.indexDocumentIntoLibrary(
      req.params.id,
      req.user._id,
    );
    return res.json({
      message: "Document indexed into Knowledge Library successfully",
      ...result,
    });
  } catch (err) {
    next(err);
  }
};
