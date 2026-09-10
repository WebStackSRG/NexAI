# Feature Spec 05 — Personal Knowledge Library

## Goal

Implement the Personal Knowledge Library (Phase 0 Feature 05) adhering to the strict **Suggest → Review → Confirm Lifecycle**:
1. Save links (URLs) or raw notes (`POST /library/save`).
2. Automatic web extraction via `cheerio` (extract page `<title>`, meta description, readable body text).
3. Gemini 2.0 Flash AI extraction: generates concise 2-3 sentence summary and suggests 3-5 relevant organizational tags.
4. Two-step confirmation flow: items are saved with `status: 'pending'` and returned with AI suggestions. The frontend shows a Review & Confirm dialog where the user can inspect/edit the title, summary, and tags before committing with `PATCH /library/:id/confirm`.
5. Vector embedding using Gemini text embeddings (`text-embedding-004` / `gemini-embedding-001`) and upsert to Pinecone Starter (`nexai-library` index, namespace `library`). Includes in-memory vector index fallback when Pinecone credentials are not configured in local development.
6. Full Library list view with search filter, type filter (`all`, `link`, `note`), status badges (`pending` amber dot, `confirmed`, `broken`), tag chips, pinned toggle, and delete confirmation (`DELETE /library/:id`).

## Skills / Docs Read

- `AGENTS.md` (Tech Stack Lock, Suggest → Review → Confirm Lifecycle, Free-Tier discipline)
- `context/build-plan.md` (Feature 05 requirements)
- `context/data-models.md` (LibraryItem schema, full-text index, AgentTask schema)
- `context/ui-rules.md` (Section 6: Library List View, card anatomy, status indicators)
- `context/ui-tokens.md` (Design tokens, badges, surface elevations)
- `context/code-standards.md` (Section 3 Controller-Service-Repository, Section 4.3 Pinecone Quota Compliance)
- `gemini-api-dev` skill (`@google/genai`, `ai.models.embedContent`)

## Assumptions

1. In-memory dev fallback is implemented for LibraryItem persistence when MongoDB is offline (consistent with Auth and Chat).
2. Pinecone service supports both live Pinecone index operations and a local in-memory cosine-similarity fallback when `PINECONE_API_KEY` is not present, allowing 100% automated test coverage offline.
3. Web scraping uses a standard timeout (10s) and handles invalid or unreachable URLs gracefully by falling back to URL hostname/path as title.
4. Pinecone vectors store `{ id: libraryItem._id, values: embedding, metadata: { userId, title, type, tags } }`.

## Exact Files to Modify / Create

### Backend (`server/`)
- `server/src/models/LibraryItem.js` [NEW] — Mongoose schema for library items
- `server/src/services/extractor.service.js` [NEW] — URL fetcher and clean text parser using `cheerio`
- `server/src/services/pinecone.service.js` [NEW] — Vector database service with in-memory fallback
- `server/src/services/library.service.js` [NEW] — Library item business logic (save, confirm, search, delete)
- `server/src/schemas/library.schema.js` [NEW] — Zod validation schemas
- `server/src/controllers/library.controller.js` [NEW] — HTTP controllers for `/library`
- `server/src/routes/library.routes.js` [NEW] — Express routes with auth and validation
- `server/src/app.js` [MODIFY] — Mount `/library` routes
- `server/test-library-e2e.js` [NEW] — Automated integration test for library lifecycle

### Frontend (`web-app/`)
- `web-app/src/store/libraryStore.js` [NEW] — Zustand store for library items, active filters, and save modal state
- `web-app/src/components/library/SaveItemModal.jsx` [NEW] — Modal for adding a URL or note
- `web-app/src/components/library/SaveItemModal.module.scss` [NEW] — Modal styles
- `web-app/src/components/library/ConfirmReviewDialog.jsx` [NEW] — Suggest → Review → Confirm editor dialog
- `web-app/src/components/library/ConfirmReviewDialog.module.scss` [NEW] — Confirm dialog styles
- `web-app/src/pages/Library/LibraryPage.jsx` [MODIFY] — Full library dashboard with cards, filters, and action menus
- `web-app/src/pages/Library/LibraryPage.module.scss` [MODIFY] — Responsive card grid and toolbar styles

### Context Tracking
- `context/progress-tracker.md` [MODIFY] — Mark Feature 05 `[/] In Progress` then `[x] Completed`
- `context/memory.md` [MODIFY] — Log Decision 010 covering Library & Pinecone architecture

## Security & Auth Invariants

1. All `/library` endpoints are protected by `authMiddleware`.
2. Users can only query, confirm, or delete library items where `item.userId === req.user._id`.
3. Vector namespaces and queries must partition or filter by `userId` to prevent cross-tenant vector leakage.
4. Input text and URLs are validated via Zod (`max(50000)` characters) to prevent abuse.

## Acceptance Criteria

- [ ] `POST /library/save` accepts URL or note, extracts content, generates summary + tags via Gemini, and returns pending item.
- [ ] `PATCH /library/:id/confirm` commits user review, sets status to `confirmed`, generates embeddings, and upserts into Pinecone.
- [ ] `GET /library` lists user library items with filter by type (`all`, `link`, `note`), search query, and sort by pinned/updatedAt.
- [ ] `DELETE /library/:id` removes item from MongoDB and Pinecone vector store.
- [ ] Suggest → Review → Confirm modal allows users to review AI summary and tags before final commit.
- [ ] End-to-end automated test `node server/test-library-e2e.js` passes 100%.
- [ ] Frontend builds cleanly with zero errors (`npm run build`).

## Manual / CLI Verification Test Steps

1. Run `node server/test-library-e2e.js`.
2. Run `npm run build` in `web-app/`.
3. Test UI in browser: add link, view review dialog, edit tags, confirm, and verify card displays in library.

