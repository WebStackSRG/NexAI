# Implementation Spec — Feature 13: Developer Utilities

## Goal
Provide an integrated developer workbench at `/devtools` featuring:
1. **Code Snippet Vault**: Full-featured snippet manager with CRUD (`GET`, `POST`, `PATCH`, `DELETE` at `/snippets`), language categorization (JS, TS, Python, Go, Rust, SQL, Bash, HTML/CSS, JSON), copy to clipboard, tags, and search.
2. **JSON Formatter & Validator**: Real-time syntax validation, formatted pretty-print with custom indentation (2 or 4 spaces), minification, and visual error indicators.
3. **Regex Sandbox**: Live interactive regular expression matcher with flag controls (`g`, `i`, `m`, `s`), match breakdown, group captures, and test string highlighting.
4. **REST API Tester**: Lightweight in-browser HTTP request runner supporting methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`), customizable headers, request body editor, status codes, response timing, and formatted JSON/Text response viewer.

## Skills / Docs Read
- `AGENTS.md` (Tech Stack Lock, Zero-defect architecture, Two-Step protocol, Suggest/Review/Confirm, Render free-tier discipline)
- `context/build-plan.md` (Feature 13 specifications)
- `context/data-models.md` (`Snippet` schema structure)

## Assumptions
- Snippet persistence is backed by MongoDB `Snippet` model and shared memory fallback for dev/offline resilience.
- JSON Formatter and Regex Tester execute 100% client-side with zero server overhead, conserving Render RAM.
- REST API Tester uses standard `fetch` API directly with response headers and payload parsing.
- Mutation routes are secured via `authMiddleware` and input validation via `Zod`.

## Exact Files to Modify / Create
- [NEW] `prompts/13-developer-utilities.md` (This spec)
- [NEW] `server/src/models/Snippet.js` (Mongoose schema)
- [NEW] `server/src/schemas/snippet.schema.js` (Zod validation schemas)
- [NEW] `server/src/controllers/snippet.controller.js` (Controller endpoints with fallback)
- [NEW] `server/src/routes/snippet.routes.js` (Express router mounted at `/snippets`)
- [MODIFY] `server/src/app.js` (Mount `/snippets` route)
- [NEW] `web-app/src/store/devToolsStore.js` (Zustand store for snippet CRUD & active utility tab)
- [MODIFY] `web-app/src/pages/DevTools/DevToolsPage.jsx` (Tabs: Snippets, JSON, Regex, API Tester)
- [MODIFY] `web-app/src/pages/DevTools/DevToolsPage.module.scss` (Dark aesthetic responsive styling)
- [NEW] `server/test-snippets-e2e.js` (End-to-end automated verification script)

## Security & Auth Invariants
- All snippet mutation endpoints (`POST`, `PATCH`, `DELETE`) require valid JWT bearer tokens or auth cookies.
- Snippet access is user-scoped; users cannot mutate snippets belonging to other users.
- Zod rejects empty snippet titles, bodies, or invalid language specifiers.

## Acceptance Criteria
- [x] User can create, view, update, delete, and copy snippets.
- [x] Language filters and text search filter snippets instantly.
- [x] JSON formatter prettifies or minifies valid JSON, and displays actionable syntax errors for malformed JSON.
- [x] Regex sandbox computes live matches with indices and captures across sample text.
- [x] REST API tester executes HTTP requests and inspects status, headers, and payload.
- [x] `npm run build` succeeds with 0 errors.
- [x] `node server/test-snippets-e2e.js` passes all tests.

## Manual / CLI Verification Test Steps
1. Run `node server/test-snippets-e2e.js` to verify auth guards and snippet CRUD.
2. Run `npm run build` in `web-app/` to verify bundling and SCSS validity.
