# Implementation Spec — Feature 16: Onboarding Flow

## Goal
Implement a polished 3-step First-Run Onboarding Wizard for new users:
1. **Mode Selection**: Choose persona (General, Developer, Student, Power-User) to configure their sidebar immediately.
2. **Global AI Instructions**: Define custom system prompt instructions, tone, and response preferences.
3. **Import Knowledge Seed**: Import their first URL or document to seed their knowledge library.
Includes a "Skip for now" option and sets `onboardingComplete: true` on the user profile so it only shows once.

## Skills / Docs Read
- `context/build-plan.md` (Feature 16 specification)
- `context/data-models.md` (`User` model)
- `AGENTS.md` (Zero unencrypted secrets, Suggest-Review-Confirm)

## Assumptions
- `user.onboardingComplete` boolean flag stored in MongoDB `User` model and in-memory mock.
- On first login when `onboardingComplete === false`, `AppLayout` renders the modal wizard.
- Wizard can be skipped or completed with `PATCH /users/settings`.

## Exact Files to Modify / Create
- [MODIFY] `server/src/models/User.js` (add `onboardingComplete: { type: Boolean, default: false }`)
- [MODIFY] `server/src/services/user.service.js` (handle `onboardingComplete`)
- [NEW] `server/test-onboarding-e2e.js` (E2E test suite)
- [NEW] `web-app/src/components/onboarding/OnboardingModal.jsx` (3-step wizard)
- [NEW] `web-app/src/components/onboarding/OnboardingModal.module.scss` (Dark aesthetic modal)
- [MODIFY] `web-app/src/components/layout/AppLayout.jsx` (Render onboarding modal)

## Security & Auth Invariants
- All profile and settings routes require JWT authentication.
- Scoped to authenticated user.

## Acceptance Criteria
- User without `onboardingComplete` sees the 3-step wizard.
- Completing wizard updates mode, instructions, and seed link.
- Clicking skip marks `onboardingComplete` and closes modal.
- `node test-onboarding-e2e.js` passes.
- `npm run build` succeeds.
