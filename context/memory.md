# NexAI — Session Memory & Decision Log

> **Agent instruction**: Update this file after every feature unit. Record decisions made, breaking changes discovered, and any unfinished work that carries forward. Read this file at the start of every new session BEFORE reading progress-tracker.md.

---

## ⚡ Current Session State

| Field               | Value                                                                  |
| ------------------- | ---------------------------------------------------------------------- |
| **Session Start**   | 2026-09-11                                                             |
| **Phase**           | Phase 0 — Core MVP                                                     |
| **Status**          | Feature 05 completed — ready to begin Feature 06 (Chat with RAG)       |
| **Unfinished Work** | None                                                                   |

---

## Architecture Decisions Log

### Decision 001 — Custom Google OAuth + JWT (not Clerk)

- **Date**: 2026-09-10
- **Decision**: Use custom Google OAuth 2.0 → JWT flow instead of Clerk or Auth.js
- **Reason**: Phase 4 Chrome Extension must share the same authentication session. Clerk's session model is browser-tab-scoped and cannot be accessed from a Chrome extension service worker. Custom JWT stored in `chrome.storage.local` by the extension after the user authenticates in the main app enables seamless shared sessions.
- **Impact**: Requires implementing Google OAuth callback route manually; no Clerk dashboard; JWT refresh logic must be built manually.
- **Irreversible**: Yes — switching auth systems mid-project would require database migration and client-side refactor.

### Decision 002 — Model Names (Corrected from PRD)

- **Date**: 2026-09-10
- **Decision**: Use `gemini-2.0-flash` (not `gemini-1.5-flash`) and `gemini-2.5-pro` (not `gemini-1.5-pro`)
- **Reason**: Gemini 1.0 and 1.5 are shut down as of 2026 and return 404 errors. Current lineup: Gemini 2.0 Flash (fast/default workhorse) and Gemini 2.5 Pro (complex reasoning/agentic tasks). The PRD contained outdated model names.
- **Impact**: All `gemini.service.js` code must use these model strings. Never reference 1.0 or 1.5.

### Decision 003 — pdf-lib + docx (not Puppeteer)

- **Date**: 2026-09-10
- **Decision**: Use `pdf-lib` for PDF export and `docx` npm package for DOCX export; zero Puppeteer
- **Reason**: Puppeteer spins up a headless Chrome browser which consumes ~200–400MB RAM. Render free-tier has 512MB total. This would cause OOM crashes in production.
- **Impact**: Export fidelity is slightly lower than browser-print-to-PDF, but it's reliable on free-tier and fast.

### Decision 004 — Secrets Vault Zero-Knowledge Architecture

- **Date**: 2026-09-10
- **Decision**: PBKDF2 + AES-GCM entirely client-side; only `{ ciphertext, iv, salt }` stored server-side
- **Reason**: Even if the MongoDB database or the server process is compromised, the attacker gets only encrypted blobs they cannot decrypt without the master password.
- **Impact**: Master password is NEVER sent to the server. If a user forgets their master password, their secrets are permanently unrecoverable (by design).

### Decision 005 — Render Free Tier Cold Start Handling

- **Date**: 2026-09-10
- **Decision**: `/health` endpoint responds instantly (no DB query); frontend shows "Waking up server..." skeleton; frontend retries once after 35 seconds
- **Reason**: Render free-tier spins down after 15 minutes of inactivity. Cold starts take 30–60 seconds. This must be handled gracefully or users will think the app is broken.
- **Impact**: First-time load experience is degraded but acceptable for a capstone/demo context.

### Decision 006 — Dual Token Verification & Disconnect-Tolerant Mock Fallback

- **Date**: 2026-09-10
- **Decision**: `authMiddleware` accepts either `httpOnly` cookie (`req.cookies.token`) or `Authorization: Bearer <token>`. In non-production without live MongoDB, auth falls back immediately to an in-memory dev cache with `bufferCommands: false` on Mongoose.
- **Reason**: Web client uses secure `httpOnly` cookies; Chrome Extension companion in Phase 4 uses `Authorization: Bearer` headers. Furthermore, developers or examiners running the project without an active MongoDB connection string will not experience 10-second Mongoose buffering timeouts or crashes.
- **Impact**: Clean, unified auth middleware across both clients; instant local dev experience.

### Decision 007 — Autonomous Full-Access Execution & Local Environment Baseline

- **Date**: 2026-09-10
- **Decision**: Enabled Full-Access mode per user instruction ("not need to ask for confirmation for this project only"). The agent continues to generate rigorous implementation specs in `prompts/` for auditability, but proceeds autonomously into execution without halting. Initialized `.env` and `.env.example` templates across both `server/` and `web-app/`.
- **Reason**: Eliminates turn-by-turn interactive friction while maintaining zero-defect architecture and traceability.
- **Impact**: Feature builds proceed continuously and autonomously end-to-end.

### Decision 008 — Responsive Drawer & Mode-Filtered Navigation Architecture

- **Date**: 2026-09-10
- **Decision**: Implement responsive sidebar supporting three distinct viewport behaviors: full 240px desktop sidebar with collapse toggle, 56px icon-only rail for tablet (768px-1023px), and touch-dismissible off-canvas drawer with backdrop blur for mobile (<768px). Sidebar navigation dynamically adapts to active persona mode (`general`, `developer`, `student`, `power-user`) stored in `uiStore` with `localStorage` fallback.
- **Reason**: Meets all criteria in `context/ui-rules.md` (Section 2) while preparing UX for developer utilities, study tools, document studio, and analytics across all device factors.
- **Impact**: Seamless UX on desktop, tablet, and mobile; clean route resolution for all modes.

### Decision 009 — Server-Sent Events (SSE) Streaming & Disconnect-Tolerant Gemini Fallback

- **Date**: 2026-09-11
- **Decision**: Built Server-Sent Events endpoint `POST /chat/message` yielding real-time chunks from `@google/genai` (`gemini-2.0-flash`). Implemented resilient simulated generator fallback when `GEMINI_API_KEY` is not present, in-memory dev store fallback for Chat and Message schemas when MongoDB is offline, and automatic asynchronous title summarization after initial exchange.
- **Reason**: Enables seamless zero-friction local testing, e2e test automation, and robust production streaming complying with `context/code-standards.md` Section 2.4 and free-tier 20-message context cap.
- **Impact**: Real-time token streaming with pulsing cursor, syntax-highlighted code blocks with clipboard copy, full session CRUD (create, rename, pin, delete).

### Decision 010 — Suggest → Review → Confirm Knowledge Ingestion & Hybrid Vector Store

- **Date**: 2026-09-11
- **Decision**: Implemented two-stage Knowledge Library ingestion. Saving an item (`POST /library/save`) scrapes clean page content with `cheerio` and prompts Gemini 2.0 Flash to propose a 2-3 sentence executive summary and 3-5 tags, marked `status: 'pending'`. The user reviews/edits metadata in `ConfirmReviewDialog` before finalizing (`PATCH /library/:id/confirm`), which generates text embeddings via `text-embedding-004` (768 dimensions) and upserts vectors to Pinecone Starter (`nexai-library`, namespace `library`) with in-memory cosine fallback.
- **Reason**: Strictly complies with the Suggest → Review → Confirm lifecycle mandated in `AGENTS.md` (Section 4), preventing unreviewed data mutations and guaranteeing vector ground-truth.
- **Impact**: Clean knowledge cards, full-text and tag filtering, vector indexing ready for Feature 06 RAG.

---

## Breaking Changes Log

_(None yet — project just initialized)_

---

## Carry-Forward Items

_(None yet — project just initialized)_

---

## Unresolved Questions

| #   | Question                                                                                   | Status                      |
| --- | ------------------------------------------------------------------------------------------ | --------------------------- |
| 1   | Which Unsplash/Pexels API to use for document image search? Both are free-tier compatible. | Open — decide in Feature 08 |
| 2   | Chunking strategy: fixed 500 tokens with 50 overlap, or paragraph-based?                   | Open — decide in Feature 05 |
| 3   | Message branching UI: tab-based or tree-based?                                             | Open — decide in Feature 04 |

---

## Future Ideas (Phase 5+, Do Not Build Yet)

- Multi-language support (i18n)
- Dark/light theme auto-detection from OS preference
- Export library to Notion or Obsidian format
- Collaborative document review (read-only share link)
- Self-hosted deployment guide (Docker Compose)

---

## Environment Variables Checklist

All of these must be set before first deployment:

### Server (Render)

```
MONGODB_URI=           # MongoDB Atlas M0 connection string
GEMINI_API_KEY=        # Google AI Studio key
PINECONE_API_KEY=      # Pinecone Starter key
PINECONE_INDEX_NAME=   # e.g., nexai-library
JWT_SECRET=            # Random 64-char hex string
GOOGLE_CLIENT_ID=      # Google OAuth App client ID
GOOGLE_CLIENT_SECRET=  # Google OAuth App client secret
GOOGLE_CALLBACK_URL=   # https://your-render-url/auth/google/callback
FRONTEND_URL=          # https://your-vercel-url.vercel.app
VAPID_PUBLIC_KEY=      # Generated via web-push generate-vapid-keys
VAPID_PRIVATE_KEY=     # Generated via web-push generate-vapid-keys
NODE_ENV=production
```

### Frontend (Vercel)

```
VITE_API_URL=          # https://your-render-url.onrender.com
VITE_GOOGLE_CLIENT_ID= # Same as server
VITE_VAPID_PUBLIC_KEY= # Same as server VAPID_PUBLIC_KEY
```
