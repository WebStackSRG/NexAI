# Architecture Decisions Log

This log tracks architectural and design decisions made for the NexAI project, per Section 0 of the build guide.

## ADR-001: Transition to NexAI v2 Architecture

- **Date:** 2026-09-23
- **Status:** Accepted
- **Context:** v1 scope was overly broad and lacked SaaS monetization and credit metering. v2 trims the scope into phased deliverables with a core focus on metered token-based billing, RAG/personal library, structured document generation, and an admin dashboard.
- **Decision:** Remove legacy v1 monolithic prototype code and rebuild cleanly using a structured monorepo (`client/` and `server/`), following the Step-by-Step build order in `docs/BUILD_GUIDE.md`.

## ADR-002: SCSS Modules & Semantic Tokens (No External UI Kits)

- **Date:** 2026-09-23
- **Status:** Accepted
- **Context:** High UI quality and full customization are required without CSS framework lock-in or leaky abstractions like Tailwind/MUI.
- **Decision:** Build a custom design system with SCSS modules using CSS variables for primitives and semantic tokens. Components consume semantic variables only. Theme switching is handled via `[data-theme]` attribute on the `<html>` root, defaulting to dark mode.

## ADR-003: Step-by-Step Environment Validation

- **Date:** 2026-09-23
- **Status:** Accepted
- **Context:** Requiring all third-party API credentials (Gemini, Pinecone, Razorpay, Google OAuth) at Step 1 causes server startup failures before those features are developed.
- **Decision:** Validate environment variables with Zod, requiring only foundational server configuration (`NODE_ENV`, `PORT`, `CLIENT_URL`, `MONGODB_URI`) during Step 1. All service-specific keys are defined as optional in Step 1 and will become strictly required in their respective implementation steps. No fallback values are provided for secrets.

## ADR-004: Dev API Proxy & Flat ESLint Configuration

- **Date:** 2026-09-23
- **Status:** Accepted
- **Context:** Cross-origin cookie handling and CORS can introduce issues during local development. In addition, modern ESLint uses flat config (`eslint.config.js`).
- **Decision:** Vite development server proxies `/api` directly to `http://localhost:5000`. Flat ESLint configuration is established across both workspaces.

## ADR-005: NPM Workspaces Monorepo Organization

- **Date:** 2026-09-23
- **Status:** Accepted
- **Context:** Managing client and server independently without monorepo tooling causes script fragmentation and duplicate dependency management.
- **Decision:** Use native npm workspaces in the root `package.json` with `workspaces: ["client", "server"]`. Root scripts (`npm run dev`, `npm run lint`, `npm test`) orchestrate both workspaces simultaneously without adding third-party monorepo tools like Turborepo or Lerna.

## ADR-006: Structured Logging with Pino

- **Date:** 2026-09-23
- **Status:** Accepted
- **Context:** Standard `console.log` produces unstructured logs that cannot be easily queried in production log aggregators and lack request latency tracking.
- **Decision:** Use `pino` and `pino-http` for server-side logging. In development mode (`NODE_ENV=development`), pipe through `pino-pretty` for human-readable colorized console output; in production, emit NDJSON for high-performance log aggregation.

## ADR-007: Provider-Agnostic Vector DB Abstraction (Pinecone Deferred)

- **Date:** 2026-09-23
- **Status:** Accepted
- **Context:** Requiring Pinecone API keys and vector indexes in Step 1 blocks early local development and UI testing. Furthermore, tying core logic directly to Pinecone risks vendor lock-in.
- **Decision:** Defer vector DB initialization to Step 5 (Personal Library). All future vector operations will be isolated behind a clean `vectorDb.service.js` interface (`upsert`, `query`, `remove`), keeping the application provider-agnostic and allowing Chroma or self-hosted alternatives in the future.

## ADR-008: Health Check Degraded State Handling

- **Date:** 2026-09-23
- **Status:** Accepted
- **Context:** If the MongoDB database is disconnected, returning HTTP 200 `status: "ok"` masks backend failure from orchestrators, reverse proxies, and cloud providers (e.g. Render).
- **Decision:** In `/api/health`, check `isDbConnected()`. If connected, return HTTP 200 with `status: "ok"`, `db: "connected"`. If disconnected, return HTTP 503 Service Unavailable with `status: "degraded"`, `db: "disconnected"`.

## ADR-009: Dual-Token Architecture and Auto-Refresh Axios Interceptor

- **Date:** 2026-09-25
- **Status:** Accepted
- **Context:** Access tokens stored in localStorage are vulnerable to XSS attacks. Conversely, putting everything strictly in cookies makes it difficult for client applications to pass credentials to WebSockets, EventSource (SSE streams), and third-party tools.
- **Decision:** Implement a dual-token strategy:
  1. **Access Token:** Short-lived (15 minutes), kept in memory in the client Zustand store, passed as `Authorization: Bearer <token>` in HTTP requests and SSE queries.
  2. **Refresh Token:** Long-lived (7 days), stored in an `httpOnly`, `SameSite=None; Secure` (production) cookie inaccessible to JavaScript.
  3. **Auto-Refresh Interceptor:** The client Axios instance intercepts 401 Unauthorized responses, queues pending requests, requests a fresh access token from `/api/auth/refresh`, and transparently retries the failed requests without interrupting the user session. On page reload, `checkAuth` runs once on app mount to re-hydrate the session seamlessly.

## ADR-010: Server-Sent Events (SSE) Streaming and Atomic Credit Ledger Metering

- **Date:** 2026-09-25
- **Status:** Accepted
- **Context:** Delivering real-time conversational AI responses without WebSockets requires an efficient unidirectional stream. Simultaneously, ensuring real token usage accounts for billing requires strict atomic deduction that prevents negative balances or race conditions.
- **Decision:**
  1. **Streaming Protocol:** Use HTTP Server-Sent Events (SSE) via `POST /api/chats/:id/messages` using standard chunk headers (`text/event-stream`). Events follow a typed structure (`event: token`, `event: done`, `event: error`).
  2. **Atomic Token Metering:** Credits are computed as `Math.ceil(tokensUsed / 100) * CREDITS_PER_100_TOKENS` from real Gemini `usageMetadata`. User credits are decremented atomically using MongoDB `$max: [0, { $subtract: ['$wallet.creditsRemaining', creditsDeducted] }]` and `$add` on `totalTokensConsumed`, guaranteeing `creditsRemaining >= 0`. Every call creates an immutable `UsageLog` entry.
  3. **Zero Balance Gatekeeping:** The `creditCheck` middleware halts execution prior to invocation if `wallet.creditsRemaining <= 0` with HTTP 402 `INSUFFICIENT_CREDITS`.
  4. **Gemini SDK:** Adopted the official `@google/genai` SDK with model identifiers dynamic via environment variables (`GEMINI_FLASH_MODEL`, `GEMINI_PRO_MODEL`), defaulting to `gemini-3.8-flash` and `gemini-3.1-pro-preview`.

## ADR-011: Reactive Streaming Chat UI, Live Credit Synchronization, and Composer State Machine

- **Date:** 2026-09-25
- **Status:** Accepted
- **Context:** Delivering a responsive, production-ready AI chat experience requires incremental token rendering, syntax-highlighted code with copy ergonomics, live wallet credit synchronization without page reloads, and responsive handling of low-credit/402 states.
- **Decision:**
  1. **Fetch & ReadableStream SSE Reader:** Implemented `lib/sse.js` using `fetch` with `ReadableStream` decoder to handle incoming `token`, `done`, and `error` event chunks.
  2. **Reactive Credit State Sync:** On receiving the `done` SSE packet containing `{ creditsRemaining, tokensUsed }`, `chatStore` directly calls `useAuthStore.getState().updateCredits(...)`, instantly updating the `CreditBadge` in the topbar and responsive drawers without any page reload or background polling.
  3. **Error Recovery & Transient Demand Handling:** Integrated friendly error sanitization for Google 503 high-demand states with auto-retry and in-bubble action triggers (Regenerate / Resend prompt).
  4. **Composer State & 402 Gatekeeping:** The composer supports Enter to send and Shift+Enter for newlines. When `insufficientCredits` (HTTP 402) occurs, the input locks with a prominent "Recharge to continue" banner directing users to `/wallet`.

## ADR-012: Personal Library, Semantic Vector Search, and Suggest-Review-Confirm Flow

- **Date:** 2026-09-25
- **Status:** Accepted
- **Context:** Storing unstructured articles and notes with simple keyword search leads to poor retrieval when users recall concepts rather than exact words. Furthermore, automatically saving AI summaries without user review risks populating the personal knowledge base with inaccurate or hallucinated metadata.
- **Decision:**
  1. **Suggest &rarr; Review &rarr; Confirm Pattern:** Implemented a two-step flow (`SaveItemModal` containing `SaveItemForm` and `SuggestionReview`). AI suggestions are generated via `POST /api/library/suggest` (metered through `creditCheck` and atomic token deduction), presented to the user for editing (title, summary, tags), and committed to MongoDB only when explicitly confirmed.
  2. **Link Content Extraction:** Implemented `linkExtractor.service.js` with `cheerio` to extract clean title, meta description, and article body text while stripping out scripts, styles, navigations, and advertisements.
  3. **Provider-Agnostic Vector Database Abstraction:** Implemented `vectorDb.service.js` exposing `upsert`, `query`, and `remove`. Supports Pinecone as the production index while providing a resilient in-memory cosine-similarity fallback for local development and test isolation without third-party credentials.
  4. **Semantic Vector Search with Hybrid Text Fallback:** `GET /api/library/search?q=` generates query embeddings via Gemini embedding models (`text-embedding-004`), queries the vector database filtered strictly by `userId`, and merges/ranks results with MongoDB `$text` search to ensure comprehensive coverage.

## ADR-013: Unified Collapsible Sidebar and Minimalist Hero Chat Canvas

- **Date:** 2026-09-26
- **Status:** Accepted
- **Context:** The initial desktop layout presented a global navigation sidebar alongside an inner nested chat sub-sidebar on `/chat`, consuming excessive horizontal screen space and fragmenting user navigation. Modern AI interfaces (Gemini, Claude) employ a single, unified, collapsible navigation rail.
- **Decision:**
  1. **Single Collapsible Rail:** Replace the duplicate double-sidebar with a single responsive navigation rail supporting two states: Collapsed (64px icon rail with tooltips) and Expanded (260px wide drawer with brand header, `+ New chat`, `Search chats` filter, navigation links, filterable Recents conversation history with pin/rename/delete actions, and a user wallet card).
  2. **Minimalist Hero State:** In the chat workspace, empty or new conversations render an uncluttered hero headline ("Where should we start?"), a glowing floating prompt bar with model selection (`Flash` / `Pro`), voice dictation (Web Speech API), file attachment, and quick starter suggestion chips.
  3. **Full-Width Message Thread:** Active chat conversations occupy the full workspace width for maximum readability.

## ADR-014: Consolidated Knowledge Library Architecture

- **Date:** 2026-09-26
- **Status:** Accepted
- **Context:** Maintaining separate disconnected pages for "Library" (links/notes) and "Documents" (AI structured drafts) causes feature fragmentation and user confusion about where generated content lives. Users also need a centralized place to store uploaded local files and view AI interview evaluation reports.
- **Decision:**
  1. **Unified Library Hub:** Consolidate Links, Notes, AI Generated Documents, Uploaded Custom Files, and Interview Reports into a single `/library` page backed by the polymorphic `LibraryItem` Mongoose schema (`type: "link" | "note" | "document" | "file" | "interview"`).
  2. **Tabbed Content Filtering:** Provide instant tabbed filters: `All`, `Notes & Links`, `Documents`, `Files`, `Interviews`.
  3. **Chat Context Attachment:** The chat composer includes an attachment trigger allowing users to seamlessly inject context either by selecting an existing item from their Library or uploading a new file from their device.

## ADR-015: AI Interview Platform Architecture and Metered Evaluation Scorecards

- **Date:** 2026-09-26
- **Status:** Accepted
- **Context:** Developers and diploma/engineering students preparing for viva examinations, technical screenings, and HR rounds lack an interactive, voice-enabled simulation environment that provides rigorous real-time questioning and actionable competency analytics.
- **Decision:**
  1. **Interactive Simulation Arena:** Build an `/interview` feature allowing users to configure target role (Full-Stack, React, Node.js, System Design, Capstone Viva), seniority, and topic. Gemini acts as an experienced interviewer conducting dynamic turn-by-turn dialogue with hints and follow-up probes.
  2. **Voice Ripple Audio Visualizer & Transcript:** Implement an animated audio ripple/waveform reflecting speaking state for both the candidate and AI. Include Web Speech API speech-to-text input, optional text-to-speech playback, and a collapsible live transcript drawer.
  3. **Comprehensive Scorecard Report:** Upon interview conclusion, Gemini evaluates candidate responses against an assessment rubric: Overall Score (0-100), rating, categorical breakdown (Technical Accuracy, Problem Solving, Communication, System Design), key strengths, and tailored study recommendations.
  4. **Automatic Library Archival:** The generated scorecard and transcript are automatically archived into the user's Library under the `interview` category for permanent access and study.
  5. **Credit Metering:** Every conversational turn and final evaluation report passes through `creditCheck` middleware and deducts credits atomically using real token usage: $\lceil \text{totalTokens} / 100 \rceil$.

## ADR-016: Project Workspaces, Local Source File Context Injection, and Isolated Conversation Memory

- **Date:** 2026-09-26
- **Status:** Accepted
- **Context:** Complex developer workflows (such as MSBTE capstone viva prep, repository architecture design, or full-stack feature planning) require grouping related conversations, enforcing persistent system instructions, and providing custom context files (code, markdown, specifications) without having to re-upload or re-explain context in every individual chat session.
- **Decision:**
  1. **Project Data Model:** Implemented `Project` model with `userId`, `name`, `description`, `color`, `customInstructions`, and embedded `sources: [{ name, content, size, mimeType, createdAt }]`.
  2. **Chat Association & Memory Isolation:** Added `projectId` and `pinned` flags to `Chat` model. The `Chat` model indexes `{ userId: 1, projectId: 1, updatedAt: -1 }`. Chats can be associated with a project or moved between projects.
  3. **Runtime Agent Context Injection:** In `chat.agent.js` and `chat.controller.js`, when a chat has a `projectId`, the agent automatically prepends the project's `customInstructions` to the system prompt and injects up to 50,000 characters per source file as ground truth reference context into Gemini's prompt stream.
  4. **Frontend Workspaces UI:** Created `/projects` gallery and `/projects/:id` workspace pages with split-screen layout, project capacity progress bar (up to 2MB text capacity), source file uploader, source text viewer modal, and project settings modal.
  5. **Unified Sidebar Integration:** Integrated a collapsible "Projects" section in the primary sidebar with quick creation, project switching, chat unlinking/moving, and direct chat creation within projects.

## ADR-017: AI Mock Interview Demo Simulation Mode (Zero-Credit Testing Engine)

- **Date:** 2026-09-26
- **Status:** Accepted
- **Context:** When developers or users evaluate the AI Mock Interview Platform locally or during staging with zero credit balance or when third-party Gemini API quotas are exhausted, testing the end-to-end interactive workflow (setup, Web Speech dictation, Voice Ripple audio visualizer, real-time SSE critique streaming, scorecard evaluation, and polymorphic library archival) was blocked by HTTP 402 `INSUFFICIENT_CREDITS`.
- **Decision:**
  1. **Session Simulation Flag:** Added `isSimulation: { type: Boolean, default: false }` to `InterviewSession` schema and Zod validators.
  2. **Zero-Credit Middleware Exemption:** `creditCheck` middleware passes requests through when `isSimulation: true` (or `x-simulation: true` header / `?simulation=true` query) is present, with zero token deductions.
  3. **Multi-Turn SSE Streaming Simulator:** In `respondInterview`, simulated sessions stream realistic multi-turn technical questions (Concurrency & Boundaries &rarr; Resilience & Load Shedding &rarr; Observability & Tracing &rarr; Distributed Caching & Tradeoffs) in real-time word chunks over SSE, triggering authentic typing and Voice Ripple visualizer animations.
  4. **Scorecard Generation & Library Archival:** In `concludeInterview`, simulated sessions compute a comprehensive scorecard (0-100 overall score, category breakdown, recommendations) and auto-archive into `LibraryItem` with `type: 'interview'` and `[Simulation]` title badge.
  5. **Frontend Ergonomics:** Added a "🎮 Demo Simulation (No Credits Required)" button to `InterviewSetup.jsx` and the credit warning banner in `InterviewPage.jsx`, and added a `Demo Simulation` badge to `InterviewArena.jsx`.
  6. **Zero Regression Safety:** Live Gemini AI logic and credit wallet metering remain 100% untouched and fully active when `isSimulation` is false.

## ADR-018: Unified Hybrid Search and Enhanced Command Palette Architecture

- **Date:** 2026-09-26
- **Status:** Accepted
- **Context:** Finding previously created content in personal AI workspaces is fragmented when users have to individually check the Library, Prompt Vault, and Chat History. A unified, cross-domain hybrid retrieval system was required that combines vector semantic similarity with full-text indexing, backed by a global keyboard-accessible Command Palette (Ctrl+K).
- **Decision:**
  1. **Cross-Domain Search Engine:** Implemented `search.service.js` and `GET /api/search?q=&type=&limit=` executing scoped queries strictly isolated to `req.user._id`:
     - **Knowledge Library:** Hybrid retrieval combining vector similarity via `vectorDbService.query` (using Gemini embedding `text-embedding-004`) and MongoDB `$text` / regex search on title, summary, content, tags, and document sections.
     - **Prompt Vault:** Full-text and regex search on prompt title, description, template, and tags, prioritizing favorites.
     - **Chat History:** Search across chat titles and message contents, returning matched messages with surrounding snippet context and role attribution.
  2. **Categorized Multi-Tab Search UI:** Built `/search` page featuring real-time debounced search, category tabs with live counts (`All`, `Library`, `Prompts`, `Chats`), highlighted snippet matches, empty states with recent search caching in `localStorage`, and direct navigation links to respective workspaces.
  3. **Live Command Palette Integration:** Upgraded global `CommandPalette` (Ctrl+K) to dynamically execute live unified searches alongside standard navigation commands, presenting categorized results for instant keyboard-driven jump actions.

## ADR-019: Wallet, Razorpay Test Mode, Webhook Architecture & Concurrency Idempotency

- **Date:** 2026-09-26
- **Status:** Accepted
- **Context:** Metered SaaS applications require robust billing flows where user wallets are credited based on verified third-party payment gateways. Because payment notifications can arrive concurrently from both client-side redirect/checkout verification and server-side webhook deliveries (or duplicate webhook retries), an atomic idempotency strategy is mandatory to eliminate double-crediting.
- **Decision:**
  1. **Server-Side Plan Configuration:** All plan tiers, currency pricing (in INR and paise), credit quantities, and privilege elevations are hard-coded in `server/src/config/plans.js`. The client never dictates price or credit amounts (`GET /api/wallet/plans`).
  2. **Raw-Body Webhook Parser Isolation:** In `server/src/app.js`, mounted `/api/webhooks` with `express.raw({ type: '*/*' })` strictly *before* global `express.json()` middleware. This preserves the pristine HTTP body buffer required for authentic Razorpay HMAC SHA256 signature verification (`X-Razorpay-Signature`).
  3. **Atomic Idempotent Transaction Ledger:**
     - A unique index on `Transaction.paymentId` is enforced in MongoDB.
     - When a payment is processed via `/wallet/verify` or `/webhooks/razorpay`, `processSuccessfulPayment` atomically attempts `findOneAndUpdate({ orderId, status: { $ne: 'success' } }, ...)` or catches MongoDB `E11000` duplicate key collisions on `paymentId`.
     - User wallet credits (`wallet.creditsRemaining`) are incremented via `$inc` **if and only if** the transaction status transition lock is acquired. Concurrent requests or repeated retries safely return the existing transaction record without duplicate crediting.
  4. **Razorpay Test Mode Integration:** Built `client/src/features/wallet/` (`PlanCard`, `TransactionTable`) and `WalletPage.jsx` supporting dynamic script injection (`https://checkout.razorpay.com/v1/checkout.js`), test-card checkout flows, and a zero-friction "⚡ Instant Test Mode Recharge" action for automated grading and offline demo environments.



## ADR-020: Role-Gated Admin Analytics Dashboard & Aggregation Pipeline

- **Date:** 2026-09-27
- **Status:** Accepted
- **Context:** Platform administrators require comprehensive visibility into platform KPIs, token consumption trends, model utilization split (Flash vs Pro), revenue metrics, and error rates, while preventing non-admin users from viewing sensitive administrative data.
- **Decision:**
  1. **Strict RBAC & Route Protection:** Implemented `requireRole('admin')` middleware on server (`/api/admin/*`) and `AdminRoute.jsx` on client, returning HTTP 403 Forbidden to non-admin users and automatically redirecting unauthenticated users.
  2. **High-Performance Aggregations:** Aggregated platform statistics via MongoDB aggregation pipelines (`UsageLog.aggregate`, `Transaction.aggregate`) for daily time-series analysis, model breakdown, and recent transaction audit logs.
  3. **Data Visualization:** Built an admin portal with interactive charts and KPI metric cards using semantic design tokens and accessible data tables.

## ADR-021: Hardening, Supertest End-to-End User Journey Suite & Viva Defense Guide

- **Date:** 2026-09-27
- **Status:** Accepted
- **Context:** Prior to final capstone defense and production release, the monorepo required end-to-end integration validation across interconnected domains, code cleanliness verification (zero console logs, clean build output), and a comprehensive technical defense preparation guide.
- **Decision:**
  1. **Supertest E2E Journey Suite (`server/tests/e2e.journey.test.js`):** Engineered a multi-step user lifecycle test verifying the complete user progression in sequence:
     - User registration & starter credit provisioning (`POST /api/auth/register`)
     - Wallet balance verification (`GET /api/wallet`)
     - AI Chat creation and SSE streaming response with atomic credit deduction (`POST /api/chats`, `POST /api/chats/:id/messages`)
     - Suggest -> Review -> Confirm Library workflow (`POST /api/library/suggest`, `POST /api/library`)
     - AI Mock Interview lifecycle (`POST /api/interview/start` -> `POST /api/interview/:id/respond` -> `POST /api/interview/:id/conclude` with scorecard & auto-archival)
     - Wallet recharge order creation and cryptographic HMAC SHA-256 verification (`POST /api/wallet/orders`, `POST /api/wallet/verify`)
     - Admin verification of platform KPIs and completed transactions (`GET /api/admin/stats`, `GET /api/admin/transactions`)
     - Credit exhaustion gate (HTTP 402 `INSUFFICIENT_CREDITS`)
  2. **Code Cleanliness & Build Polish:** Fixed CSS property syntax warnings in `client/src/features/wallet/PlanCard.module.scss`, verified zero debug `console.log` in production runtime code, and ensured complete parity in `.env.example` configurations.
  3. **Viva Defense Guide (`docs/viva-prep.md`):** Authored an in-depth viva examination defense guide detailing system architecture diagrams, RAG pipeline mechanics, the 5 core moats explaining why NexAI is not an AI wrapper, and model answers for the top 10 toughest capstone defense questions.
