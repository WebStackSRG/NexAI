# Implementation Specification: Feature 10 & 11 — Unified Global Search & Command Palette

## Goal
Implement a lightning-fast, multimodal search and command center. Includes backend endpoint `GET /search?q=` running parallel semantic queries across Pinecone vector embeddings (namespace `library`), MongoDB `$text` / in-memory search on library items, exact and fuzzy title matches on prompts, documents, and chat sessions. Integrates a global `Ctrl+K` / `Cmd+K` keyboard shortcut that summons an interactive Command Palette modal with instant fuzzy filtering over application navigation, quick actions (New Chat, New Doc, Save Link, Settings), and global knowledge search results grouped by category.

## Skills / Docs Read
- `context/build-plan.md` (Feature 10: Unified Global Search, parallel queries across Pinecone, MongoDB, and titles; Feature 11: Command Palette `Ctrl/Cmd + K`, global shortcut, fuzzy search, keyboard navigation, recent items)
- `context/ui-rules.md` (Modal popover standards, keyboard navigation, accessibility)
- `context/code-standards.md` (Error boundaries, fast latency, defensive validation)

## Assumptions
- When query `q` is short (<2 chars), Command Palette presents Quick Navigation links and system action triggers (New Chat, Open Library, Settings, etc.).
- When `q` has >=2 chars, `GET /search?q=` queries:
  1. Pinecone Starter semantic search with query vector embedding via `text-embedding-004`
  2. Library items (matching title, summary, tags, content)
  3. Saved Documents (matching title, section headings)
  4. Prompt Vault templates (matching title, variables, template text)
  5. Chat sessions (matching title)
- Arrow Up / Arrow Down keys navigate the active selection; `Enter` activates the link or action; `Escape` closes the palette.

## Exact Files to Modify / Create
- `server/src/schemas/search.schema.js` [NEW] — Zod validation for search query parameters (`q`, `limit`).
- `server/src/services/search.service.js` [NEW] — Aggregation service executing parallel vector and relational searches.
- `server/src/controllers/search.controller.js` [NEW] — Controller for `GET /search`.
- `server/src/routes/search.routes.js` [NEW] — Search router mounted at `/search`.
- `server/src/app.js` [MODIFY] — Mount `/search` router.
- `web-app/src/lib/searchApi.js` [NEW] — Client API helper for unified search.
- `web-app/src/components/search/CommandPalette.jsx` [NEW] — Global modal command palette listening to `Ctrl+K` / `Cmd+K`, supporting keyboard arrows/enter, quick commands, and categorized search results.
- `web-app/src/components/search/CommandPalette.module.scss` [NEW] — Glassmorphism modal styling with search input, result items, badges, and shortcut keys.
- `web-app/src/components/layout/AppLayout.jsx` [MODIFY] — Mount CommandPalette and wire topbar search trigger.
- `server/test-search-e2e.js` [NEW] — Automated E2E verification test suite for search and unauthorized rejection.

## Security & Auth Invariants
- `GET /search` protected by `authMiddleware`.
- Strict user-isolation: all queries filter by `userId === req.user._id`.
- Zod schema validation enforces max query length.

## Acceptance Criteria
- [x] `GET /search?q=` executes parallel searches across Pinecone vector embeddings, library items, documents, and prompts.
- [x] Returns structured results grouped by type: `{ library, documents, prompts, chats }`.
- [x] Pressing `Ctrl+K` or `Cmd+K` anywhere opens the Command Palette.
- [x] Keyboard navigation (Arrow keys + Enter + Escape) seamlessly navigates results and actions.
- [x] Empty query state displays Quick Actions and Navigation targets.
- [x] Automated E2E test suite passes 100%.

## Manual / CLI Verification Test Steps
1. Run `node server/test-search-e2e.js` to verify search accuracy, multi-entity retrieval, and auth enforcement.
2. Run `npm run build` in `web-app/` to ensure bundle compilation.

