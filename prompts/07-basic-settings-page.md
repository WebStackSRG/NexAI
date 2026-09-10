# Implementation Specification: Feature 07 — Basic Settings Page

## Goal
Implement the user settings subsystem completing Phase 0 (Core MVP). Allows authenticated users to view their read-only Google profile, configure and persist `globalInstructions` (which dynamically ground the Gemini system prompt across all chat and document workflows), manage UI preferences (`sidebarMode`, `theme`, `streamingEnabled`), and configure notification toggles via `GET /users/settings` and `PATCH /users/settings`.

## Skills / Docs Read
- `context/build-plan.md` (Feature 07: User profile, `globalInstructions`, sidebar mode, notification preferences, theme)
- `context/data-models.md` (Section 1: `users` schema: `preferences`, `globalInstructions`, `notificationPrefs`)
- `context/ui-rules.md` (Section 3: Forms & Inputs; Section 7: Spacing & Tokens)
- `context/code-standards.md` (Zod validation, error handling, clean async routes)

## Assumptions
- Profile information (name, email, avatar) is read-only and sourced from the Google OAuth identity.
- Preferences updated via `PATCH /users/settings` immediately update the user record in MongoDB (and dev cache fallback) and refresh client stores (`useAuthStore`, `useUiStore`).
- `globalInstructions` are already hooked into `server/src/controllers/chat.controller.js` (line 159: `req.user.globalInstructions`), so saving them immediately alters subsequent chat generation.

## Exact Files to Modify / Create
- `server/src/schemas/user.schema.js` [NEW] — Zod validation schema for updating user settings.
- `server/src/services/user.service.js` [NEW] — User retrieval and update methods with DB and devUsersMap support.
- `server/src/controllers/user.controller.js` [NEW] — `getSettings` and `updateSettings` handlers.
- `server/src/routes/user.routes.js` [NEW] — `GET /users/settings` and `PATCH /users/settings` routes protected by `authMiddleware`.
- `server/src/app.js` [MODIFY] — Mount `/users` route.
- `web-app/src/lib/api.js` [MODIFY] — Add `getSettings` and `updateSettings` API methods.
- `web-app/src/pages/Settings/SettingsPage.jsx` [MODIFY] — Complete settings UI with Google profile badge, global system instructions with character count and suggestions, sidebar mode selector, streaming toggle, and notification preference switches with toast feedback.
- `web-app/src/pages/Settings/SettingsPage.module.scss` [MODIFY] — SCSS styling with token variables and glassmorphism.
- `server/test-settings-e2e.js` [NEW] — Automated E2E verification test.

## Security & Auth Invariants
- `GET /users/settings` and `PATCH /users/settings` are strictly protected by `authMiddleware`.
- Input is validated against `userSettingsSchema` using Zod middleware.
- Read-only fields (`googleId`, `email`, `_id`) cannot be modified through the settings route.

## Acceptance Criteria
- [x] `GET /users/settings` returns the authenticated user's profile and settings.
- [x] `PATCH /users/settings` validates input and persists `globalInstructions`, `preferences`, and `notificationPrefs`.
- [x] Frontend displays user avatar, name, and email with a verified badge.
- [x] Changing `globalInstructions` updates the DB/store and affects subsequent chats.
- [x] Selecting a persona/sidebar mode syncs with `useUiStore` and updates the app layout.
- [x] Automated test script passes 100%.

## Manual / CLI Verification Test Steps
1. Run `node server/test-settings-e2e.js` to verify auth rejection, valid updates, and invalid payload rejection.
2. Run `npm run build` in `web-app/` to ensure clean compilation.
