# Implementation Specification: Feature 19 — Creative Writing Suite

## Goal
Implement the Creative Writing Suite integrated directly within the Document Studio and Synthesis workspace. Authors can select genre (e.g., Sci-Fi, Fantasy, Thriller, Cyberpunk, Mystery, Non-Fiction), tone (e.g., Dark, Humorous, Suspenseful, Epic, Reflective), and writing style. Features include multi-chapter continuation with outline tracking, character notes panel, and world-building reference cards with one-click injection into the Tiptap section editor.

## Skills / Docs Read
- `context/build-plan.md` (Feature 19 specifications: Genre/style/tone selector, multi-chapter continuation, character + world-building notes panel)
- `context/data-models.md` (Document schema with sections, versionHistory)
- `context/code-standards.md` (Pure JS exports, Gemini 2.0 Flash / 2.5 Pro usage)
- `AGENTS.md` (Suggest -> Review -> Confirm lifecycle for generation)

## Assumptions
- Multi-chapter documents leverage the existing `Document` model where each section represents a chapter or scene.
- Creative writing assistant endpoint `POST /documents/creative-continue` uses Gemini 2.0 Flash / 2.5 Pro with custom creative prompts conditioned on previous chapters, active character notes, and world lore.
- Character and world-building notes can be stored either in document metadata or exported directly into active sections.

## Exact Files to Modify / Create
- [NEW] `prompts/19-creative-writing-suite.md`
- [NEW] `server/src/services/creativeWriting.service.js` (AI chapter continuation & character/world-building brainstorming)
- [MODIFY] `server/src/controllers/document.controller.js` (mount creative writing endpoints)
- [MODIFY] `server/src/routes/document.routes.js`
- [NEW] `server/test-creative-writing-e2e.js` (automated test)
- [NEW] `web-app/src/pages/Documents/CreativeWritingPanel.jsx` (Genre, Tone, Multi-chapter continuation, Character/World notes)
- [NEW] `web-app/src/pages/Documents/CreativeWritingPanel.module.scss`
- [MODIFY] `web-app/src/pages/Documents/DocumentsPage.jsx` (Toggle between Standard Synthesis mode and Creative Writing Studio mode)

## Security & Auth Invariants
1. JWT auth required on all creative writing endpoints.
2. Zod validation for genre, tone, style, character profiles, and chapter prompts.
3. Zero-defect error handling with fallback mock continuation if Gemini API key is missing.

## Acceptance Criteria
1. User can switch to "Creative Writing Mode" in Document Studio.
2. User can select Genre, Tone, and Style.
3. User can maintain Character notes (name, role, archetype, description) and World-Building notes.
4. User can click "Continue Chapter" or "Generate Next Chapter" which injects a structured chapter into the document sections.
5. All generated content is immediately editable in Tiptap and exportable to PDF/DOCX.

## Manual / CLI Verification Test Steps
1. Run `node server/test-creative-writing-e2e.js`.
2. Run `npm run build` in `web-app/`.
