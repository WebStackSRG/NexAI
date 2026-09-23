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
