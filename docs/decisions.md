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
