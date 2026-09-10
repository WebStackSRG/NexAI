# Implementation Specification: Feature 12 — File & Document Upload + Multimodal Analysis

## Goal
Implement client-side drag-and-drop file ingestion and server-side multimodal processing. Users can upload PDF documents, text files, and images (PNG, JPEG, WEBP) directly in the Knowledge Library or Chat. Gemini 2.0 Flash / 2.5 Pro performs multimodal OCR analysis, structured summary extraction, and tag classification. Extracted text is chunked and embedded into Pinecone (namespace `library`) and persisted as `LibraryItem` with `type: 'file'`, immediately available for full-text search and RAG conversational grounding.

## Skills / Docs Read
- `context/build-plan.md` (Feature 12: File upload UI for PDF/image/text, Gemini 2.5 Pro multimodal analysis/OCR, Pinecone chunked embedding, Library type: 'file')
- `context/data-models.md` (Section 3: `libraryItems` schema: `type: 'file'`, `mimeType`, `content`, `summary`, `tags`, `vectorId`)
- `AGENTS.md` (Render 512MB RAM constraint — no Puppeteer, in-memory buffers capped at 10MB)

## Assumptions
- For file upload without external S3/Cloudinary credentials, files under 10MB are parsed in-memory (base64/buffer) and processed via Gemini API `inlineData` parts (`image/jpeg`, `image/png`, `application/pdf`, `text/plain`).
- When `GEMINI_API_KEY` is not present, a deterministic multimodal parser extracts text and generates structured summaries for local development and CI testing.
- Uploaded files generate vector embeddings and display in `/library` with a specialized file badge and download/view preview.

## Exact Files to Modify / Create
- `server/src/schemas/file.schema.js` [NEW] — Zod validation for base64 file upload payload.
- `server/src/services/fileAnalysis.service.js` [NEW] — Gemini multimodal processing service (image OCR, PDF analysis, chunking).
- `server/src/controllers/file.controller.js` [NEW] — Handler for `POST /library/upload`.
- `server/src/routes/library.routes.js` [MODIFY] — Add `POST /upload` endpoint.
- `web-app/src/components/library/FileUploadModal.jsx` [NEW] — Drag-and-drop file upload modal with file-type detection, progress indicator, and OCR preview.
- `web-app/src/pages/Library/LibraryPage.jsx` [MODIFY] — Add "Upload File" action button opening `FileUploadModal`.
- `server/test-file-upload-e2e.js` [NEW] — Automated E2E test suite for multimodal file upload, OCR, and vector indexing.

## Security & Auth Invariants
- Route protected by `authMiddleware`.
- Maximum file payload size strictly capped at 10MB to avoid Render free-tier OOM crashes.
- File mime-types restricted to `['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/plain', 'text/markdown']`.

## Acceptance Criteria
- [x] `POST /library/upload` accepts valid file payloads with filename, mimeType, and base64 content.
- [x] Gemini multimodal parser analyzes images and PDFs, returning extracted text, executive summary, and tags.
- [x] Ingested file is saved as a confirmed `LibraryItem` with `type: 'file'` and indexed into Pinecone.
- [x] Frontend allows drag-and-drop file selection with live processing states.
- [x] Automated E2E test suite passes 100%.

## Manual / CLI Verification Test Steps
1. Run `node server/test-file-upload-e2e.js` to verify file upload, OCR extraction, and library indexing.
2. Run `npm run build` in `web-app/` to verify build integrity.
