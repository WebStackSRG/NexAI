# Implementation Spec — Feature 14: Learning & Study Suite

## Goal
Build an intelligent Learning & Study Suite accessible at `/focus` featuring:
1. **SM-2 Spaced Repetition Flashcards**:
   - Mongoose `Flashcard` schema (`userId`, `sourceType`, `question`, `answer`, `easeFactor`, `interval`, `repetitions`, `nextReviewAt`).
   - SM-2 calculation engine: Given user feedback (0: Again, 3: Hard, 4: Good, 5: Easy), update `easeFactor`, `interval` (days), and `nextReviewAt`.
   - CRUD and review endpoints: `GET /flashcards` (with `?due=true` or `all`), `POST /flashcards` (manual create), `PATCH /flashcards/:id/review` (submit SM-2 rating), `DELETE /flashcards/:id`.
2. **AI Flashcard Deck Generator**:
   - `POST /flashcards/generate`: Takes source text, topic, or document content and uses **Gemini 2.0 Flash** to generate a structured JSON deck `[{ question, answer }]` with instant review readiness.
3. **YouTube Video Summarizer**:
   - `POST /learning/youtube-summary`: Takes YouTube video URL or ID, extracts transcript or video metadata (via official/fallback scraper), and generates key takeaways, chapter breakdown, and revision notes using Gemini 2.0 Flash.
4. **Interactive Learning UI**:
   - 3D card flip animation with keyboard shortcuts (Space to flip, 1-4 for ratings).
   - Spaced repetition progress tracker (cards due today, ease score).
   - YouTube summarizer workbench with video preview embed and actionable synthesis notes.

## Skills / Docs Read
- `AGENTS.md` (Locked choice: Gemini 2.0 Flash for speed & efficiency, Zero-defect architecture, SM-2 formula)
- `context/data-models.md` (`Flashcard` model)
- `context/build-plan.md` (Feature 14 specification)

## Assumptions
- Memory fallback `devFlashcardsMap` active when MongoDB is offline during test or local runs.
- Gemini 2.0 Flash generates structured `application/json` output for flashcard generation.
- SM-2 Algorithm follows classical SuperMemo-2:
  - `EF' = EF + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))` (EF >= 1.3).
  - If `grade < 3`: `repetitions = 0`, `interval = 1`.
  - Else if `repetitions == 0`: `interval = 1`.
  - Else if `repetitions == 1`: `interval = 6`.
  - Else: `interval = Math.round(interval * EF)`.

## Exact Files to Modify / Create
- [NEW] `prompts/14-learning-study-suite.md` (This spec)
- [NEW] `server/src/models/Flashcard.js`
- [NEW] `server/src/schemas/flashcard.schema.js`
- [NEW] `server/src/services/sm2.service.js` (SM-2 math engine)
- [NEW] `server/src/services/learning.service.js` (Gemini flashcard & YouTube summary generators)
- [NEW] `server/src/controllers/flashcard.controller.js`
- [NEW] `server/src/controllers/learning.controller.js`
- [NEW] `server/src/routes/flashcard.routes.js`
- [NEW] `server/src/routes/learning.routes.js`
- [MODIFY] `server/src/app.js` (Mount `/flashcards` and `/learning`)
- [NEW] `web-app/src/store/learningStore.js` (Zustand atomic slice)
- [MODIFY] `web-app/src/pages/Focus/FocusPage.jsx` (Interactive flashcards review & YouTube analyzer)
- [MODIFY] `web-app/src/pages/Focus/FocusPage.module.scss` (Dark aesthetic flip cards, deck summary)
- [NEW] `server/test-learning-e2e.js` (E2E test suite)

## Security & Auth Invariants
- All flashcard and study routes are protected by `authMiddleware`.
- Zod validation enforces structured inputs.
- YouTube URLs are validated to prevent SSRF against internal networks.

## Acceptance Criteria
- [x] User can create manual flashcards and review due cards with SM-2 updates.
- [x] AI Flashcard Generator extracts question/answer pairs from custom topics.
- [x] YouTube video summarizer produces structured key takeaways.
- [x] Client renders interactive flip cards with Next Review timestamps.
- [x] All automated tests pass: `node server/test-learning-e2e.js`.
- [x] `npm run build` succeeds with zero errors.
