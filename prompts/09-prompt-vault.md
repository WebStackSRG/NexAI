# Implementation Specification: Feature 09 — Prompt Vault

## Goal
Implement the Prompt Vault subsystem allowing users to create, organize, pin, and execute reusable system prompts with `{{variable}}` template syntax. Includes automated variable extraction (`/\{\{(\w+)\}\}/g`), popover fill dialog for real-time interpolation, one-click "Use in Chat" routing directly to `/chat` with filled prompt pre-populated, usage telemetry (`useCount`, `lastUsedAt`), and tag filtering in grid/list view.

## Skills / Docs Read
- `context/build-plan.md` (Feature 09: `/prompts` grid/list view, `{{variable}}` template syntax, variable extraction, fill form, "Use in chat", pin/tag/search, useCount)
- `context/data-models.md` (Section 5: `prompts` schema: `userId`, `title`, `template`, `variables`, `tags`, `pinned`, `lastUsedAt`, `useCount`)
- `AGENTS.md` (Suggest → Review → Confirm lifecycle; security boundaries)

## Assumptions
- When a user saves or updates a prompt, the server extracts variable names via regex and saves them into the `variables` array.
- "Use in chat" increments `useCount`, updates `lastUsedAt`, stores the filled prompt in `chatStore` draft or navigates with state to `/chat`, opening an active session with the prompt ready to run.
- Pinning, tagging, and search allow fast access in either Grid or List layout mode.

## Exact Files to Modify / Create
- `server/src/models/Prompt.js` [NEW] — Mongoose model matching `context/data-models.md`.
- `server/src/schemas/prompt.schema.js` [NEW] — Zod validation schemas for prompt creation, update, and usage.
- `server/src/services/prompt.service.js` [NEW] — Prompt CRUD, regex variable extraction, and useCount increment.
- `server/src/controllers/prompt.controller.js` [NEW] — Handlers for list, create, get, update, delete, and use.
- `server/src/routes/prompt.routes.js` [NEW] — Express routes under `/prompts`.
- `server/src/app.js` [MODIFY] — Mount `/prompts` route.
- `web-app/src/lib/promptApi.js` [NEW] — Client API functions for prompt CRUD and usage.
- `web-app/src/store/promptStore.js` [NEW] — Zustand store for prompt library, search, tags, active variable modal, and layout view.
- `web-app/src/components/prompts/PromptModal.jsx` [NEW] — Modal for creating/editing template prompts with live variable badge preview.
- `web-app/src/components/prompts/VariableFillModal.jsx` [NEW] — Modal for populating `{{variable}}` placeholders with preview and "Launch in Chat".
- `web-app/src/pages/Prompts/PromptsPage.jsx` [MODIFY] — Complete Prompt Vault UI with grid/list switcher, search, tag filters, pin toggle, and execution launcher.
- `web-app/src/pages/Prompts/PromptsPage.module.scss` [MODIFY] — SCSS styling for cards, list view, tag chips, and variable inputs.
- `server/test-prompt-e2e.js` [NEW] — Automated E2E verification test suite.

## Security & Auth Invariants
- All `/prompts` endpoints protected by `authMiddleware`.
- Strict user-isolation: users can only view, edit, or delete prompts where `userId === req.user._id`.
- Zod schema validation on all inputs.

## Acceptance Criteria
- [x] CRUD for prompts with title, template text, tags, and pinned status.
- [x] Automatic regex variable extraction: `{{topic}}`, `{{tone}}` extracted into `variables` array on save.
- [x] Popover / Modal renders an input for each extracted variable, replacing them in real-time.
- [x] "Use in Chat" increments `useCount` and navigates to `/chat` with interpolated prompt.
- [x] Grid view and List view toggle with state preserved.
- [x] Automated E2E test suite passes 100%.

## Manual / CLI Verification Test Steps
1. Run `node server/test-prompt-e2e.js` to verify CRUD, variable extraction, use count increment, and unauthorized rejection.
2. Run `npm run build` in `web-app/` to verify build integrity.

