# Implementation Specification: Feature 08 — AI Document Generator

## Goal
Implement the AI Document Generator and Document Studio completing Feature 08 of Phase 1. Authenticated users can generate structured, multi-section documents from natural language prompts using Gemini 2.5 Pro (returning structured `[{ heading, body }]` JSON), edit sections live with a rich Tiptap editor in a split-pane layout, add/remove/reorder sections, insert images (URL/stock/AI), export documents directly to PDF (via `pdf-lib`) and DOCX (via `docx`) entirely in pure JavaScript without headless browsers, auto-save to MongoDB, and automatically index finished documents into the Knowledge Library for RAG grounding.

## Skills / Docs Read
- `context/build-plan.md` (Feature 08: Two-panel layout, Gemini 2.5 Pro structured JSON, Tiptap editor, section CRUD/reorder, image insertion, pdf-lib, docx, auto-save + Library indexing)
- `context/data-models.md` (Section 4: `documents` schema)
- `AGENTS.md` (Decision 002: Gemini 2.5 Pro model lock; Decision 003: pdf-lib pure JS + docx npm pure JS, strict ban on Puppeteer/Playwright)
- `context/ui-rules.md` (Split-pane view, forms, buttons, responsive design)

## Assumptions
- Document generation uses Gemini 2.5 Pro (`gemini-2.5-pro`) with structured JSON schema output, falling back gracefully to rich template generation when offline or without API key.
- PDF and DOCX generation executes client-side using pure JS `pdf-lib` and `docx` npm packages, ensuring 0MB Render RAM overhead and instantaneous client downloads.
- Indexed documents create or update a corresponding `LibraryItem` with `type: 'document'`, generating vector embeddings into Pinecone namespace `library` for unified RAG citations.

## Exact Files to Modify / Create
- `server/src/models/Document.js` [NEW] — Mongoose schema for documents and sections per `context/data-models.md`.
- `server/src/schemas/document.schema.js` [NEW] — Zod validation schemas for document creation, section generation, updates, and indexing.
- `server/src/services/gemini.service.js` [MODIFY] — Add `generateDocumentSections` using `gemini-2.5-pro` with structured JSON output and mock generator fallback.
- `server/src/services/document.service.js` [NEW] — Document CRUD, section management, version snapshotting, and Knowledge Library sync.
- `server/src/controllers/document.controller.js` [NEW] — Handlers for list, create, get, update, delete, generate-sections, and index-library.
- `server/src/routes/document.routes.js` [NEW] — Express routes mounted at `/documents`.
- `server/src/app.js` [MODIFY] — Mount `/documents` route.
- `web-app/src/lib/documentExport.js` [NEW] — Pure JS client-side export utility using `pdf-lib` and `docx` with styled headings, body text, and metadata.
- `web-app/src/lib/documentApi.js` [NEW] — API client functions for document CRUD and AI section generation.
- `web-app/src/store/documentStore.js` [MODIFY] — Zustand store for documents list, active document, sections, generation status, and unsaved changes.
- `web-app/src/pages/Documents/DocumentsPage.jsx` [MODIFY] — Split-panel AI Document Studio with generation prompt input, Tiptap editor pane, section manager list with reordering/deletion/addition, image insertion dialog, live word/char counters, and pure JS PDF/DOCX export triggers.
- `web-app/src/pages/Documents/DocumentsPage.module.scss` [MODIFY] — SCSS module styling for split-panel workspace, Tiptap toolbar, and preview cards.
- `server/test-document-e2e.js` [NEW] — Automated E2E verification test suite.

## Security & Auth Invariants
- All `/documents` endpoints protected by `authMiddleware`.
- Strict user-isolation: users can only view, edit, or delete documents where `userId === req.user._id`.
- Zod schema validation on all inputs.
- Zero headless browser processes (Render 512MB RAM constraint defended).

## Acceptance Criteria
- [x] Dedicated `/documents` interface with two-panel layout: left panel for document outline/section manager & AI prompt generator; right panel for Tiptap rich text editing and preview.
- [x] "Generate Document" calls `POST /documents/generate` using Gemini 2.5 Pro returning structured sections with headings and detailed content.
- [x] Sections can be added, edited live, reordered, and removed.
- [x] Client-side "Export PDF" generates styled multi-page PDF using `pdf-lib`.
- [x] Client-side "Export DOCX" generates formatted Word document using `docx`.
- [x] Auto-save / Manual save persists document to MongoDB / memory dev store.
- [x] "Index into Library" automatically syncs the document to Knowledge Library with vectors for RAG grounding.
- [x] Automated E2E tests pass 100%.

## Manual / CLI Verification Test Steps
1. Run `node server/test-document-e2e.js` to verify auth, document CRUD, AI section generation, and library indexing.
2. Run `npm run build` in `web-app/` to verify pure JS Tiptap, pdf-lib, and docx bundle integrity.

