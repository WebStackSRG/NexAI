## Goal
Implement Feature 15 (Productivity / Focus: Reminders, Quiet Hours, and Workspace Sessions) to allow users to schedule reminders on library items or custom study tasks, configure quiet hours to suppress notification dispatch, and save/launch curated workspace link sessions.

## Skills / Docs Read
- context/build-plan.md (Feature 15 specification)
- context/code-standards.md (Zod validation, Mongoose patterns, error boundaries)
- AGENTS.md (Free-tier Render 512MB RAM rules, zero unencrypted sensitive storage, Web Push + VAPID)

## Assumptions
- Reminders can be set for a specific timestamp (emindAt) with a message/title and optional link to a library or document item.
- Notification dispatch can use standard Web Notifications API on client and server-side reminder storage with quiet-hours suppression logic.
- Workspace Sessions store an array of title + URL pairs that can be launched together in browser tabs.
- Quiet hours config is stored in User.settings.quietHours (nabled: boolean, start: "22:00", end: "08:00").

## Exact Files to Modify / Create
- [NEW] server/src/models/Reminder.js (Mongoose schema for user reminders)
- [NEW] server/src/models/WorkspaceSession.js (Mongoose schema for saved tab/link bundles)
- [NEW] server/src/schemas/reminder.schema.js (Zod validation schemas)
- [NEW] server/src/controllers/reminder.controller.js (CRUD for reminders and workspace sessions)
- [NEW] server/src/routes/reminder.routes.js (Endpoints mounted at /focus)
- [MODIFY] server/src/app.js (Mount /focus routes)
- [NEW] server/test-focus-e2e.js (E2E automated verification tests)
- [MODIFY] web-app/src/store/learningStore.js (Add reminders and workspace sessions actions)
- [MODIFY] web-app/src/pages/Focus/FocusPage.jsx & SCSS (Add Reminders & Workspace Sessions tab to Focus suite)

## Security & Auth Invariants
- All /focus/* endpoints protected by JWT auth middleware.
- Input validation enforced with Zod on create/update routes.
- User scoping: users can only view, update, or delete their own reminders and workspace sessions.

## Acceptance Criteria
- User can create, list, toggle complete, and delete reminders.
- Quiet hours can be configured and checked before dispatching notifications.
- User can save a workspace session with multiple links and open all links simultaneously.
- Automated tests pass with 100% success.
- Web app builds with zero errors.

## Manual / CLI Verification Test Steps
- 
ode server/test-focus-e2e.js -> Passes all reminder & workspace session tests.
- 
pm run build in web-app/ -> 0 errors.
