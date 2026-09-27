# NexAI AI Agent Playbook & Prompting Guide

> **Purpose:** This document is the practical, step-by-step operations manual for prompting and steering AI agents (Antigravity, Gemini, Claude, Cursor) to build, test, debug, and verify features for the NexAI platform without architectural drift, breaking changes, or scope creep.

---

## 1. Core Architecture & Rules of Engagement

Every AI agent working on NexAI must strictly adhere to the project foundations already established in the repository. Whenever you start a new conversation or step with an agent, ensure the agent operates under these five non-negotiable invariants:

### 1.1 The Golden Invariants

1. **Source of Truth:**
   - [`docs/PRD.md`](file:///d:/1_projects/Production_ready/NexAI/docs/PRD.md) defines **WHAT** to build (features, data models, business rules).
   - [`docs/BUILD_GUIDE.md`](file:///d:/1_projects/Production_ready/NexAI/docs/BUILD_GUIDE.md) defines **HOW** to build (conventions, tokens, folder structure, build order).
   - If they conflict: PRD wins on scope; BUILD_GUIDE wins on architecture and code quality. Any architectural trade-off must be logged in [`docs/decisions.md`](file:///d:/1_projects/Production_ready/NexAI/docs/decisions.md).
2. **Stack Constraints:**
   - **Frontend:** React 18 + Vite, custom SCSS modules, CSS custom properties (design tokens), Zustand, React Router 7, Axios. **Strictly NO Tailwind, MUI, Chakra, or external CSS component kits.**
   - **Backend:** Node.js (ESM) + Express, Mongoose (MongoDB), `@google/genai` (Gemini SDK), Pinecone (behind `vectorDb.service.js`), `pdf-lib`, Razorpay (test mode), Zod validation, JWT + Google OAuth.
   - **Model Names:** Model names (`GEMINI_FLASH_MODEL`, `GEMINI_PRO_MODEL`, `GEMINI_EMBED_MODEL`) must come **strictly from environment variables**, never hard-coded.
3. **Credit & Metering System:**
   - Every AI call (chat, library suggest, document generation, interview turn, title generation) must pass through `creditCheck` middleware.
   - Token-to-credit conversion: $\lceil \text{totalTokens} / 100 \rceil \times \text{CREDITS\_PER\_100\_TOKENS}$.
   - Credits are deducted **atomically** from `wallet.creditsRemaining` (never below 0) and logged in `UsageLog`.
   - At 0 credits: respond with HTTP `402 INSUFFICIENT_CREDITS` and prompt the user to recharge.
4. **Suggest $\rightarrow$ Review $\rightarrow$ Confirm:**
   - AI outputs (summaries, tags, structured document sections, interview scorecards) must **never be auto-committed** to the database without explicit user confirmation or structured completion flow.
5. **Git Branching Lifecycle:**
   - Always branch from `dev`: `git checkout dev && git checkout -b feature/<name>`
   - Work in small, verifiable steps with Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`).
   - Run `npm test` and `npm run lint` before merging.
   - Merge back using `--no-ff`: `git checkout dev && git merge --no-ff feature/<name>`
   - Delete the feature branch once verified. `main` is reserved exclusively for production releases.

### 1.2 Step Progress & Current Repository State

> **CRITICAL FOR ALL AGENTS:** Always check this status ledger before proposing or writing code. **NEVER** re-implement, duplicate, or overwrite completed steps.

| Step | Scope / Feature | Branch | Status | Test Coverage |
| :--- | :--- | :--- | :--- | :--- |
| **Step 1** | Scaffold, Tooling, Tokens & Base Primitives | `feature/scaffold` | ✅ **COMPLETED** | Verified |
| **Step 2** | JWT Auth, Cookies, Google OAuth, Refresh Interceptor | `feature/auth` | ✅ **COMPLETED** | 13 integration tests |
| **Step 3** | Backend Chat, Gemini SSE Streaming, Atomic Credit Deduction | `feature/backend-chat` | ✅ **COMPLETED** | 13 integration tests |
| **Step 4** | Chat UI, Markdown/Code Highlighting, Live Balance Sync | `feature/chat-ui` | ✅ **COMPLETED** | 19 client tests |
| **Step 5** | Personal Library, Vector Embeddings, Hybrid Search | `feature/library` | ✅ **COMPLETED** | 10 integration tests |
| **Step 6** | Unified Sidebar, Chat Canvas & **Project Workspaces** | `feature/sidebar-and-hero-ui` | ✅ **COMPLETED & MERGED TO DEV** | 114 tests passing across monorepo |
| **Step 7** | **Prompt Vault & In-Chat Template Integration** | `feature/prompt-vault` | ✅ **COMPLETED** | 137 tests passing across monorepo |
| **Step 8** | Consolidated Library & Document Management | `feature/consolidated-library` | ✅ **COMPLETED** | 147 tests passing across monorepo |
| **Step 9** | **AI Mock Interview Platform** | `feature/ai-interview` | ✅ **COMPLETED & MERGED TO DEV** | 10 integration tests & UI |
| **Step 10**| **Unified Search & Command Palette (Ctrl+K)** | `feature/search` | ✅ **COMPLETED & MERGED TO DEV** | 10 integration + 9 client tests |
| **Step 11**| **Wallet, Recharge & Razorpay Billing** | `feature/wallet-billing` | ✅ **COMPLETED & MERGED TO DEV** | 9 integration + 4 client tests |
| **Step 12**| **Admin Analytics Dashboard** | `feature/admin-dashboard` | ✅ **COMPLETED & MERGED TO DEV** | 8 integration + 9 client tests |
| **Step 13**| **Hardening, Supertest E2E Suite & Viva Defense Guide** | `feature/hardening` | 🎯 **NEXT ACTIVE STEP** | Production release gate |

---

### 1.3 Architecture FAQ: Why is the AI Interview Platform Scheduled as Step 9?

A common question during development planning is: **"Should the Interview section come earlier or next?"**

The Answer: **The Interview section is strictly scheduled as Step 9, and was NOT skipped or missed.**
Here is the strict architectural dependency chain:
1. **Dependency on Consolidated Library (Step 8):** In Step 9, when a mock interview concludes, the Gemini agent generates an assessment scorecard and transcript that **must be automatically archived into the user's Library under `type: 'interview'`**. Step 8 establishes this polymorphic `LibraryItem` schema (`type: 'link' | 'note' | 'document' | 'file' | 'interview'`). Building Step 9 before Step 8 would require temporary throwaway schemas or broken foreign references.
2. **Dependency on Voice and Prompt Foundation (Steps 6 & 7):** Step 6 introduced Web Speech API voice dictation (`useSpeechRecognition`), and Step 7 introduces prompt parameter injection which the interview arena utilizes for viva examiner personas.
3. **Execution Plan:** Follow the exact order: **Step 6 (Done) $\rightarrow$ Step 7 (Next) $\rightarrow$ Step 8 $\rightarrow$ Step 9 (AI Interview)**.

---

### 1.4 UI Consistency & Design Token Invariants

All future screens, modals, and components must adhere strictly to the established NexAI UI standard:

1. **Tokens Only (Zero Hard-Coded Values):**
   - **Colors:** Use CSS custom properties: `var(--color-bg-app)`, `var(--color-bg-surface)`, `var(--color-bg-elevated)`, `var(--color-border)`, `var(--color-text-primary)`, `var(--color-text-secondary)`, `var(--color-accent)`.
   - **Current Accent:** Emerald Green (`#10b981` / `--color-accent`) is active across both themes.
   - **Spacing:** Use 4px token scale: `var(--space-1)` (4px) through `var(--space-16)` (64px).
   - **Typography:** `var(--font-sans)` for UI, `var(--font-mono)` for code/logs.
   - **Transitions:** `var(--duration-base) var(--ease-standard)`.
2. **Dual-Theme Support:**
   - Dark theme is default (`[data-theme='dark']`).
   - Every component must also look sharp and readable in Light theme (`[data-theme='light']`). Never assume a dark background.
3. **Component Layering & Composition:**
   - `pages/` assemble feature modules (`features/`).
   - `features/` assemble reusable design-system primitives (`components/ui/`): `Button`, `IconButton`, `Input`, `Textarea`, `Modal`, `Drawer`, `Dropdown`, `Card`, `Badge`, `Skeleton`, `EmptyState`.
   - If a visual pattern appears twice, extract it into a reusable component under `components/ui/` or `features/`.
4. **State & Network Layer Discipline:**
   - Components **never** call Axios directly.
   - All network calls live in `src/lib/api/<domain>.api.js`.
   - Zustand stores (`src/store/`) expose state and actions that call the API helpers, handle toasts, and update reactive state.
5. **State Handling (The 4 UX States):**
   - Every data-fetching screen must explicitly render:
     1. **Loading State:** Using `Skeleton` or `Spinner` primitives.
     2. **Empty State:** Using `EmptyState` primitive with icon, title, description, and primary call-to-action button.
     3. **Error State:** Clear error message with retry trigger.
     4. **Success State:** Dense, responsive, accessible presentation.

---

## 2. Anatomy of the "Golden Prompt"

When requesting work from an AI agent, **do not give vague instructions** like _"build step 6"_ or _"fix the sidebar"_. Instead, use this battle-tested 6-part prompt structure:

```markdown
### 1. CONTEXT & REFERENCES

- Operating on branch: `feature/<feature-name>` (branched from `dev`).
- Read: `docs/PRD.md` (Section X), `docs/BUILD_GUIDE.md` (Step X), and ADR-0XX in `docs/decisions.md`.
- Workspace rules: Strictly SCSS modules with semantic tokens, thin controllers, services for logic, Zustand for client state.

### 2. OBJECTIVE & SCOPE

- Implement [Feature Name].
- Core Deliverables: [Bullet points of exact screens, components, and API endpoints].
- STRICT BOUNDARIES: Do NOT modify [unrelated files]; do NOT introduce external libraries; do NOT build future scope items.

### 3. TECHNICAL SPECIFICATIONS

- Frontend files to create/touch: `client/src/...`
- Backend files to create/touch: `server/src/...`
- State management: `client/src/store/...`
- API contracts: Route, HTTP method, request validation schema, response structure.
- Tokens to consume: Use `--color-*`, `--space-*`, `--radius-*` from `styles/tokens/`.

### 4. STEP-BY-STEP IMPLEMENTATION PLAN

1. [Backend schemas, validation, routes, controllers, services]
2. [Client API helper, Zustand store actions]
3. [UI components, SCSS modules, page integration]
4. [Unit and integration test suites]

### 5. ACCEPTANCE CRITERIA

- [ ] Feature works end-to-end with zero mock data.
- [ ] Responsive in both Dark (default) and Light themes.
- [ ] Loading, Empty, Error (with retry), and Success states handled.
- [ ] `npm run lint` passes across client and server.
- [ ] `npm test` passes with zero regressions.

### 6. OUTPUT EXPECTATIONS

- Provide a brief plan first before editing.
- Make targeted file modifications.
- Run tests and linting to verify.
- Summarize changes and propose the Conventional Commit message.
```

---

## 3. Step-by-Step Prompt Catalog (Steps 6 through 13)

Use these copy-paste ready prompt templates for executing the upcoming phases of NexAI.

---

### Step 6: Unified Collapsible Sidebar, Minimalist Chat Canvas & Project Workspaces — `[COMPLETED & MERGED TO DEV]`

> **Status:** Step 6 and the Project Workspaces architecture are fully implemented, verified, and merged into `dev`. All 114 tests are passing. **Do not re-execute or branch for Step 6.**

#### Completed Deliverables:
- Single responsive collapsible sidebar (64px / 260px) in `AppLayout` with localStorage persistence.
- Direct "+ New chat", live chat filter, recents list with rename, pin, and delete actions.
- ChatHero component ("Where should we start?") with glowing prompt bar, Web Speech API voice dictation, model picker (Flash/Pro), and starter chips.
- ChatGPT-style **Project Workspaces**:
  - Model: `Project` with custom instructions, color tags, and file knowledge sources.
  - Runtime: Source file injection (up to 50k chars each) and custom instructions injection into Gemini agent system prompt.
  - UI: Project Gallery (`/projects`), Project Workspace (`/projects/:id`), 2MB capacity tracking, and collapsible Projects section in sidebar.

---

### Step 7: Prompt Vault & In-Chat Template Integration — `[COMPLETED]`

#### 🚀 Implementation Prompt

```text
We are ready to build Step 7: Prompt Vault & In-Chat Template Integration from docs/BUILD_GUIDE.md and docs/PRD.md Section 3.

Please follow these exact requirements:
1. Branch: Create and checkout `feature/prompt-vault` from `dev`.
2. Backend:
   - Ensure `Prompt` Mongoose model has `{ userId, title, description, template, tags, variables: [String], isFavorite, createdAt, updatedAt }`.
   - On save/update, auto-extract variable placeholders using regex `/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g` (deduplicated).
   - CRUD routes in `server/src/routes/prompt.routes.js`: `GET /api/prompts`, `POST /api/prompts`, `PATCH /api/prompts/:id`, `DELETE /api/prompts/:id`.
   - Validate request payloads with Zod in `server/src/validators/prompt.validator.js`.
   - Ensure all queries are scoped strictly to `req.user._id`.
3. Frontend:
   - Create `client/src/features/prompts/`: `PromptCard`, `PromptFormModal`, `VariableFillModal`.
   - Implement `client/src/pages/Prompts/PromptsPage.jsx` with tag filtering, search bar, and grid layout.
   - In `client/src/store/promptStore.js`, manage prompts state with API integration.
   - In `client/src/features/chat/`:
     - Add a "Save to Prompt Vault" action button on assistant and user message bubbles.
     - Add a "Use Prompt" trigger in the chat composer that lets users pick a saved prompt, opens `VariableFillModal` to substitute variables, and inserts the compiled text into the chat input.
4. Testing & Verification:
   - Add backend tests in `server/tests/prompt.test.js` covering CRUD, variable extraction, and user isolation.
   - Add frontend component tests for `VariableFillModal`.
   - Verify `npm test` and `npm run lint`.
```

#### 🔍 Verification Prompt

```text
Verify Step 7:
1. Run `npm test` and confirm all prompt backend and frontend tests pass.
2. Verify that creating a prompt with template "Analyze {{code}} for {{language}}" correctly stores `variables: ["code", "language"]`.
3. Verify that clicking "Use Prompt" in `/chat` opens the VariableFillModal, prompts for `code` and `language`, and populates the composer with the substituted string.
4. Verify that non-owners cannot edit or delete another user's prompt (HTTP 403/404).
```

#### ⚠️ What If It Breaks?

- **Issue: Regex fails on variables with spaces like `{{ user_name }}`.**
  _Prompt:_ `"The variable extraction regex failed to trim spaces inside brackets. Use `/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g`and map matches with`match.replace(/[{}]/g, '').trim()` to ensure clean variable names."*
- **Issue: Chat composer newline or cursor position is lost after inserting a prompt.**
  _Prompt:_ `"When inserting a compiled prompt into the chat composer, the textarea focus is lost. Ensure the composer ref calls `.focus()` and sets cursor selection to the end of the newly inserted text."*

---

### Step 8: Consolidated Library & Document Management — `[COMPLETED]`

#### 🚀 Implementation Prompt

```text
We are ready to build Step 8: Consolidated Library & Document Management from docs/BUILD_GUIDE.md, PRD Section 3, and ADR-014.

Please follow these exact requirements:
1. Branch: Create and checkout `feature/consolidated-library` from `dev`.
2. Data Model & Backend:
   - Consolidate bookmarks, notes, AI-generated documents, and custom uploaded files into the polymorphic `LibraryItem` model (`type: 'link' | 'note' | 'document' | 'file' | 'interview'`).
   - Add `POST /api/library/documents/generate`:
     - Validates `{ prompt, category }`.
     - Calls `docGen.agent.js` using Gemini JSON mode to produce structured `{ title, category, sections: [{ heading, body }] }`.
     - Protected with `creditCheck` and atomic token deduction.
     - Returns draft without auto-saving (Suggest -> Review -> Confirm).
   - Add `GET /api/library/documents/:id/export.pdf`:
     - Streams a styled PDF generated server-side using `pdf-lib` (clean typography, headings, page numbering).
   - Support file uploads (`type: 'file'`) for text, markdown, and PDF files.
3. Frontend:
   - Update `client/src/pages/Library/LibraryPage.jsx` with tabbed navigation: `All`, `Notes & Links`, `Documents`, `Files`, `Interviews`.
   - Create `DocGeneratorModal` with split-pane live markdown preview and edit mode.
   - Create `FileUploader` with drag-and-drop support.
   - In `client/src/features/chat/Composer.jsx`, add the file context attachment trigger allowing users to attach items from their library or upload local files as chat context.
4. Verification:
   - Add tests for `docGen.agent`, PDF export endpoint, and library tab filtering.
   - Verify `npm test` and `npm run lint`.
```

#### 🔍 Verification Prompt

```text
Verify Step 8:
1. Run `npm test` across workspaces.
2. Test document generation flow: generate a document draft, edit a section in the preview, confirm save, and verify it appears in the "Documents" tab.
3. Test PDF export: trigger `export.pdf` on a saved document and verify that `pdf-lib` generates a valid, downloadable PDF file without crashing.
4. Test chat context attachment: attach a library item in chat, send a query, and verify the model responds with awareness of the attached content.
```

#### ⚠️ What If It Breaks?

- **Issue: `pdf-lib` crashes due to long text wrapping or page overflowing.**
  _Prompt:_ `"The PDF export service crashes or clips text when document sections exceed one page. Implement line wrapping and pagination logic in `pdfExport.service.js`using`font.widthOfTextAtSize`and create new pages dynamically when`currentY < marginBottom`."*
- **Issue: Gemini JSON output fails Zod validation.**
  _Prompt:_ `"The Gemini response for structured doc generation occasionally returns markdown code fences (\`\`\`json ... \`\`\`) causing Zod JSON.parse to fail. Add a sanitization step that strips leading/trailing markdown blocks before calling `JSON.parse` and Zod schema parsing."*

---

### Step 9: AI Mock Interview Platform — `[NEXT ACTIVE STEP]`

#### 🚀 Implementation Prompt

```text
We are ready to build Step 9: AI Mock Interview Platform from docs/BUILD_GUIDE.md, PRD Section 3, and ADR-015.

Please follow these exact requirements:
1. Branch: Create and checkout `feature/ai-interview` from `dev`.
2. Backend:
   - Create `InterviewSession` Mongoose model: `{ userId, role, difficulty, topic, status: 'in_progress' | 'completed', messages: [{ role, content, timestamp }], scorecard, totalTokensUsed, createdAt, updatedAt }`.
   - Routes in `server/src/routes/interview.routes.js`:
     - `POST /api/interview/start`: creates session, calls Gemini for personalized interviewer greeting and first question. (Metered with creditCheck).
     - `POST /api/interview/:id/respond`: receives candidate answer, streams interviewer critique + next question over SSE. (Metered with creditCheck).
     - `POST /api/interview/:id/conclude`: evaluates candidate transcript, calls Gemini with JSON schema to produce comprehensive scorecard `{ overallScore, rating, categories: { technicalAccuracy, problemSolving, communication, systemDesign }, strengths, improvements, summary }`. Auto-archives the completed interview and scorecard into `LibraryItem` (`type: 'interview'`). (Metered with creditCheck).
     - `GET /api/interview`: lists user sessions.
     - `GET /api/interview/:id`: retrieves session details.
3. Frontend:
   - Route `/interview` in `client/src/router/index.jsx`.
   - Setup screen: Select Role (Full-Stack, React, Node.js, System Design, MSBTE Capstone Viva), Seniority, and Topic.
   - Simulation Arena (`InterviewArena.jsx`):
     - Voice Ripple animation component (`VoiceRipple.jsx`): animated concentric CSS ripples reacting to speech activity (candidate speaking vs AI speaking).
     - Live collapsible transcript tray showing full turn history.
     - Speech-to-Text dictation with Web Speech API and optional Text-to-Speech audio readout for interviewer questions.
   - Scorecard Report View (`Scorecard.jsx`): radar/bar metrics, badges, key strengths, study recommendations, and "View in Library" link.
4. Testing:
   - Add integration tests for start, respond, and conclude flows in `server/tests/interview.test.js`.
   - Verify `npm test` and `npm run lint`.
```

#### 🔍 Verification Prompt

```text
Verify Step 9:
1. Run `npm test` and check that all interview API and component tests pass.
2. Start an interview session via the UI, verify credits are deducted, and confirm the first question appears.
3. Submit a candidate response via voice/text and verify SSE streaming works.
4. Conclude the interview and verify:
   - A valid JSON scorecard is generated.
   - An entry with `type: 'interview'` is auto-saved in the Library.
   - User wallet credits reflect token deduction.
```

#### ⚠️ What If It Breaks?

- **Issue: SSE connection terminates prematurely during long interviewer responses.**
  _Prompt:_ `"The interview SSE stream drops before the done event. Verify that `res.setHeader('Content-Type', 'text/event-stream')`, `res.setHeader('Cache-Control', 'no-cache')`, and `res.setHeader('Connection', 'keep-alive')`are set, and flush headers immediately with`res.flushHeaders()` before streaming Gemini chunks."*
- **Issue: Audio ripple doesn't animate or causes high CPU usage.**
  _Prompt:_ `"The VoiceRipple component is causing CPU spikes. Replace complex Canvas redraw loops with hardware-accelerated CSS keyframe animations (`transform: scale()`, `opacity`) toggled by an `isSpeaking` boolean prop."*

---

### Step 10: Unified Search & Command Palette

#### 🚀 Implementation Prompt

```text
We are ready to build Step 10: Unified Search & Command Palette from docs/BUILD_GUIDE.md and PRD Section 3.

Please follow these exact requirements:
1. Branch: Create and checkout `feature/search` from `dev`.
2. Backend:
   - Add route `GET /api/search?q=` in `server/src/routes/search.routes.js`.
   - Search across Library (`type: link, note, document, file, interview`), Prompts, and Chat History.
   - Implement hybrid ranking: Combine MongoDB `$text` search with semantic vector search via `vectorDb.service.js`. Deduplicate results and rank by relevance score.
   - Scope every query strictly to `req.user._id`.
3. Frontend:
   - Command Palette (`Ctrl+K` or `Cmd+K`):
     - Global modal opening on hotkey or search trigger in topbar.
     - Fast fuzzy search over navigation routes, recent chats, saved prompts, and library items.
     - Keyboard navigation: Up/Down arrow selection, Enter to execute, Esc to dismiss.
   - Dedicated Search Page (`/search`):
     - Detailed search results with category tabs, highlighted matching keywords, and direct links to items.
4. Testing:
   - Write backend integration test in `server/tests/search.test.js`.
   - Write frontend test for Command Palette hotkey and navigation in `client/src/features/command-palette/CommandPalette.test.jsx`.
   - Run `npm test` and `npm run lint`.
```

---

### Step 11: Wallet, Recharge & Razorpay Billing

#### 🚀 Implementation Prompt

```text
We are ready to build Step 11: Wallet & Billing from docs/BUILD_GUIDE.md, PRD Section 3 (Phase 2), and ADR-001.

Please follow these exact requirements:
1. Branch: Create and checkout `feature/wallet-billing` from `dev`.
2. Backend:
   - Server-only pricing config: Define plans and credit amounts in `server/src/config/plans.js` (never accept price or credits from client).
   - Routes in `server/src/routes/wallet.routes.js`:
     - `GET /api/wallet`: returns balance, tier, total tokens consumed.
     - `GET /api/wallet/plans`: returns available recharge packages.
     - `POST /api/wallet/orders`: creates Razorpay order for given `planId`. Returns `{ orderId, amount, currency, keyId }`.
     - `POST /api/wallet/verify`: verifies HMAC SHA256 signature (`razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`). Credits wallet atomically and writes `Transaction` record.
     - `GET /api/wallet/transactions`: returns paginated transaction history.
   - Webhook: `POST /api/webhooks/razorpay`:
     - Use `express.raw({ type: 'application/json' })` on this specific route ONLY.
     - Validate signature with `RAZORPAY_WEBHOOK_SECRET`.
     - Idempotency: Ensure unique index on `Transaction.paymentId`. A payment must be credited exactly once, regardless of whether verify or webhook arrives first.
3. Frontend:
   - Update `client/src/pages/Wallet/WalletPage.jsx`:
     - Current balance display with recharge call-to-action.
     - Plan selection cards with features and credit quantities.
     - Razorpay Checkout modal trigger (test mode).
     - Transaction history table with status badges and dates.
4. Testing:
   - Integration tests in `server/tests/wallet.test.js` verifying HMAC verification, idempotency protection against double-crediting, and signature mismatch rejection.
   - Verify `npm test` and `npm run lint`.
```

---

### Step 12: Admin Analytics Dashboard

#### 🚀 Implementation Prompt

```text
We are ready to build Step 12: Admin Analytics Dashboard from docs/BUILD_GUIDE.md and PRD Phase 2.

Please follow these exact requirements:
1. Branch: Create and checkout `feature/admin-dashboard` from `dev`.
2. Backend:
   - Protect all admin routes with `auth` and `requireRole('admin')` middleware (HTTP 403 for non-admins).
   - Routes in `server/src/routes/admin.routes.js`:
     - `GET /api/admin/stats`: total tokens consumed, active users count, mock revenue total, total error count, average request latency.
     - `GET /api/admin/usage?range=7d|30d`: daily token consumption time series and model distribution split (Flash vs Pro).
     - `GET /api/admin/transactions`: paginated list of all platform recharges.
     - `GET /api/admin/errors`: paginated list from `ErrorLog` collection.
3. Frontend:
   - Route `/admin` wrapped in `AdminRoute.jsx` in `client/src/router/index.jsx`.
   - Admin components using Recharts:
     - StatCards for key KPIs.
     - Token Consumption Area/Bar Chart.
     - Model Usage Split Donut/Pie Chart.
     - Recent Transactions Table and Error Logs Table.
   - SCSS modules and responsive layout matching design tokens.
4. Testing:
   - Integration tests verifying non-admins receive 403 Forbidden.
   - Tests verifying aggregation endpoints return valid data structures.
   - Verify `npm test` and `npm run lint`.
```

---

### Step 13: Hardening, Integration Testing & Viva Prep

#### 🚀 Implementation Prompt

```text
We are ready to build Step 13: Hardening & Viva Prep from docs/BUILD_GUIDE.md.

Please follow these exact requirements:
1. Branch: Create and checkout `feature/hardening` from `dev`.
2. End-to-End Suite:
   - Run complete multi-step user journey tests with Supertest covering: Register -> Initial Credits -> Chat Streaming -> Library Save -> Interview Turn & Scorecard -> Wallet Recharge -> Admin Verification.
3. Code Cleanliness:
   - Remove any residual console logs or debug code.
   - Ensure all `.env.example` files (client and server) reflect all required environment variables.
   - Verify production build succeeds: `npm run build` in client and `node src/server.js` startup in server.
4. Viva Defense Guide:
   - Generate `docs/viva-prep.md` addressing:
     - System architecture diagram and RAG pipeline explanation.
     - Why NexAI is not just an AI wrapper (token-based utility billing, suggest-review-confirm pattern, multi-provider vector abstraction).
     - Answers to top 10 tough examiner questions for diploma capstone defense.
5. Final Verification:
   - Run `npm run lint` and `npm test` across all workspaces.
```

---

## 4. "What If That Breaks?" — The Debugging Playbook

When an agent's code fails, tests break, or runtime errors occur, **do not write vague complaints** like _"it's not working"_. Use these targeted troubleshooting prompts to get immediate, root-cause resolutions.

### Scenario A: Test Failure (`npm test` fails)

```text
The test suite failed with the following output:
<PASTE TEST ERROR OUTPUT HERE>

Please diagnose and fix this:
1. Do NOT weaken assertions or delete tests to make them pass.
2. Find the root cause in the source code or test mock.
3. Fix the underlying issue while preserving existing architecture.
4. Re-run `npm test` and verify that all tests pass.
```

### Scenario B: Linter or Formatting Errors (`npm run lint` fails)

```text
The linter failed with the following errors:
<PASTE LINTER OUTPUT HERE>

Please resolve these lint issues:
1. Fix all unused variables, unhandled hook dependencies, or syntax errors.
2. Ensure compliance with ESLint and Prettier rules (2 spaces, single quotes, semicolons).
3. Do NOT disable ESLint rules with inline comments unless strictly necessary and justified.
4. Re-run `npm run lint` to confirm a clean check.
```

### Scenario C: SCSS Token / Styling Regression

```text
The recent UI changes broke styling consistency:
<DESCRIBE ISSUE, e.g. text is unreadable in light mode, or button has hard-coded hex colors>

Please fix this according to the NexAI Design System:
1. Check `src/styles/tokens/_primitives.scss` and `src/styles/themes/`.
2. Replace any hard-coded colors, padding, or font sizes with the appropriate CSS custom properties (e.g. `var(--color-text-primary)`, `var(--space-4)`, `var(--radius-md)`).
3. Verify that the component looks correct in BOTH `[data-theme='dark']` and `[data-theme='light']`.
```

### Scenario D: SSE Streaming or Credit Deduction Glitch

```text
The chat stream is failing or credits are not updating correctly:
<DESCRIBE SYMPTOM, e.g. done event is missing, or wallet balance shows NaN>

Please inspect the SSE and credit lifecycle:
1. Check `server/src/utils/sse.js` and `server/src/services/credit.service.js`.
2. Ensure token counts from Gemini's `usageMetadata` (prompt + candidate tokens) are correctly parsed.
3. Ensure the atomic MongoDB update decrements `creditsRemaining` and increments `totalTokensConsumed` cleanly.
4. Ensure the `done` event packet includes `{ messageId, tokensUsed, creditsDeducted, creditsRemaining }`.
5. On the client, verify `src/lib/sse.js` parses the `done` event and dispatches `updateCredits` to `useAuthStore`.
```

### Scenario E: Gemini API 503 / Rate Limit / Timeout

```text
The Gemini API returned a transient error (e.g. 503 Model Overloaded or 429 Rate Limit):
<PASTE API ERROR LOG HERE>

Please apply our resilience patterns:
1. In `server/src/services/gemini.service.js`, verify exponential backoff retry for transient 503/429 status codes.
2. Sanitize user-facing errors: never leak raw API stack traces; return friendly messages like "AI service is currently experiencing high demand. Please retry in a few moments."
3. Ensure failed attempts do NOT deduct user credits.
```

### Scenario F: Agent Hallucination or Scope Drift

```text
You introduced code or packages that violate project rules:
<SPECIFY, e.g. installed Tailwind, used an unapproved external UI library, or added mock data>

Please revert this immediately:
1. Remove any unapproved dependencies from `package.json`.
2. Rewrite the component using standard React, CSS modules, and `src/components/ui/` primitives.
3. Remove all mock data and connect directly to the real API endpoint and Zustand store.
4. Re-run `npm test` and `npm run lint`.
```

---

## 5. The 5-Point Step Verification & Merge Protocol

Before completing any step and merging into `dev`, prompt the agent to run the following **Quality Gate Checklist**:

```text
Please run our 5-Point Step Verification Checklist for Step [X]:

1. Automated Tests: Run `npm test` across server and client workspaces. All tests must pass.
2. Static Analysis: Run `npm run lint` across server and client workspaces. Must report 0 errors.
3. Documentation: Update `docs/api.md` if any endpoint changed, and update `docs/decisions.md` if an architectural decision was made.
4. Environment: Check if any new environment variables were introduced; if so, update `.env.example` in `server/` or `client/`.
5. Git Readiness:
   - Provide a clean summary of what changed.
   - Provide the exact Git commands to commit and merge back into `dev`:
     `git add .`
     `git commit -m "feat(<scope>): <description>"`
     `git checkout dev`
     `git merge --no-ff feature/<name>`
     `git branch -d feature/<name>`
```

---

## 6. Pro-Tips for Maximizing AI Agent Efficiency

1. **Keep Context High, Conversations Short:**
   - Don't try to build the entire platform in a single chat thread. Start a fresh conversation for each major step in `docs/BUILD_GUIDE.md`.
   - At the beginning of each session, reference this playbook: _"We are following docs/AGENT_PLAYBOOK.md for Step X."_
2. **Use Slash Commands Wisely:**
   - Use `/plan` when embarking on complex multi-file architectural changes (e.g. Step 8 or Step 9).
   - Use `/learn` when an agent fixes an intricate edge case so the knowledge persists in the workspace.
3. **Never Allow "TODO" Placeholders:**
   - If an agent generates `// TODO: implement later` or creates mock state, immediately prompt: _"Rule violation: No placeholder or mock logic permitted. Implement the complete, working production logic now."_
4. **Scrutinize CSS Class Names & Imports:**
   - Ensure every SCSS file uses `@use "@/styles/abstracts" as *;` and classes match `.module.scss` conventions.
5. **Always Test Both Themes:**
   - Always toggle between dark and light mode to ensure contrast ratios meet accessibility standards.
