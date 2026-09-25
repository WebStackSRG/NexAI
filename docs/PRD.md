# NexAI — AI-Powered Personal & Developer Workspace (SaaS Edition)
### Capstone PRD — Diploma Final Year (MSBTE K-Scheme) — Consolidated v2

---

## 0. What Changed From v1

v1 was an 18-module feature list (Sections A–R) covering chat, library, document generation, prompt vault, developer tools, focus tools, analytics, security, and a companion browser extension. That scope is not buildable end-to-end within a diploma capstone timeline.

v2 keeps the same core product idea but does two things differently:

1. **Trims scope into phases** — a small, fully-working Core MVP first, differentiators second, "nice to have" third, and a clearly marked Future Scope list that is explicitly *not* built for the viva.
2. **Adds a SaaS/Business layer** — credit-based usage metering, a test-mode payment flow, and an admin analytics dashboard. This reframes the project from "another AI chat wrapper" to "a cost-controlled AI SaaS platform," which directly answers the examiner's hardest question: *"ChatGPT/Gemini/Claude already exist — what's new here?"*

---

## 1. Problem Statement

Two separate problems are being solved together:

**A. Fragmentation problem (user-facing):**
People collect information (links, documents, ideas, code snippets, AI chat history) across disconnected tools — bookmarks in one place, notes in another, AI conversations in a third. There is no single, searchable personal knowledge base that also generates content and lets the user reuse their own prompts.

**B. Cost/access problem (business-model-facing):**
Consumer AI tools (ChatGPT Plus, Claude Pro, Gemini Advanced) charge a flat subscription (~₹2,000/month) regardless of actual usage. A student or light user who sends 10 prompts a month pays the same as a heavy daily user. There is no transparent, pay-for-what-you-burn AI product aimed at students/small developers.

NexAI addresses both: a unified AI workspace (chat + library + documents + prompts) billed through a metered credit system instead of a flat subscription.

---

## 2. Product Vision

**One AI workspace, metered like a utility.**

A single account and a single database power a few core surfaces:

- **Chat** — AI conversation with streaming responses, backed by a token-based credit ledger
- **Library** — save links/notes, auto-summarized and semantically searchable
- **Documents** — AI-drafted structured documents (resume/report/notes), exportable to PDF
- **Prompt Vault** — reusable, variable-driven prompt templates
- **Wallet/Billing** — credit balance, recharge, transaction history
- **Admin Dashboard** (own role) — token consumption, model split, mock revenue, error logs

Every AI action (chat message, document generation) consumes credits calculated from actual token usage returned by the model API — not a flat per-message charge — so the metering is real, not decorative.

---

## 3. Feature Scope by Phase

This is the single most important section of this document. Every feature from v1 is placed into exactly one bucket.

### Phase 0 — Core MVP (must be fully working before anything else)

| Feature | Detail |
|---|---|
| AI Chat | Gemini Flash, streaming response, chat history stored per user |
| Credit Ledger | `creditsRemaining` on user; deducted per message based on real token usage (input + output tokens from API response, converted via a simple rule e.g. 100 tokens = 1 credit) |
| Auth | Google OAuth or email/password + JWT |
| Personal Library | Save a link or note → Gemini Flash auto-summary + auto-tags → stored in MongoDB |
| Semantic Search (Library) | Embeddings via Gemini embedding model → stored in a free-tier vector DB (Pinecone Starter or Chroma self-hosted) → search by meaning, not just keyword |
| Basic Settings | Theme (dark default), default model, credits display |

**Why this alone is defensible:** it is a working, streaming, metered AI chat product with a real personal knowledge store — already more than a "wrapper," and small enough to be fully stable before the viva.

### Phase 1 — Differentiators (build after Phase 0 is stable)

| Feature | Detail |
|---|---|
| Prompt Vault | Save prompts with `{{variable}}` placeholders; small form fills variables; inserts into chat as first message; tags + search |
| AI Document Generation | User asks for a document → Gemini drafts structured sections (heading + body) → live preview pane → inline edit → export to PDF (`pdf-lib`, pure JS, no headless browser) → auto-saved into a Documents list |
| Unified Search | One search bar across Library + Documents + Prompts (keyword + semantic) |
| Command Palette (Ctrl/Cmd+K) | Jump to any screen instantly — pure frontend, no extra backend cost |

### Phase 2 — SaaS / Business Layer (the "unique" layer for the examiner)

| Feature | Detail |
|---|---|
| Wallet & Recharge Page | Shows credit balance, tier (`free` / `pro_monthly`), recharge options (e.g. ₹49 → 500 credits) |
| Payment Integration | **Razorpay Test Mode** — no real KYC or money needed for demo; test card/UPI completes a mock transaction; webhook updates `wallet.creditsRemaining` in MongoDB |
| Transaction Ledger | Every recharge stored as its own document (amount, credits added, payment ID, status, timestamp) |
| Admin Dashboard | Separate `/admin` route (role-gated). Shows: total tokens consumed, Gemini Flash vs Pro usage split (chart), mock revenue total, recent transactions, basic error/latency log count |

This phase is what turns "AI chat app" into "AI SaaS platform" in the examiner's eyes — the token ledger + webhook + admin charts are concrete, demoable engineering, not just a slide claim.

### Phase 3 — Depth (only if Phase 0–2 are solid and time remains)

| Feature | Detail |
|---|---|
| Files & Document Analysis | Upload PDF/Word → summarize / ask questions about it (Gemini multimodal, no separate OCR needed) |
| Developer Utilities (subset) | JSON formatter, regex tester, snippet manager with tags — pick 2–3, not the full list from v1 |
| Learning tools (subset) | Flashcard generator from a saved note/document — pick one, not all of Section G from v1 |

### Future Scope — explicitly NOT built (say this out loud in the report/viva)

Stating these as "considered, deliberately deferred" is stronger than silently dropping them — it shows scoping judgment.

- Companion browser extension (tab session save, global hotkey, site blocking, site-time analytics) — real value, but doubles the codebase (PWA + extension) and depends on browser APIs outside the core problem
- Pomodoro/focus tools, site blocklist — not related to the core AI-workspace problem
- Secrets vault, password breach checker — a separate security-tool product, distracts from the AI theme
- Link-rot cron crawler — background cron on Render's free tier risks memory/idle issues
- Chat branching, shareable read-only chat links, voice input/output, multi-provider model switcher (Gemini/Llama/GPT together) — good v2/v3 ideas, not needed to prove the core thesis

---

## 4. Answering the Examiner's Core Question

**"ChatGPT, Gemini, and Claude already exist. What's actually new here?"**

- **Not a new model.** NexAI does not train an LLM — it orchestrates existing foundation model APIs (Gemini Flash/Pro) through a backend agent layer. This is stated openly, not hidden.
- **The novelty is the system around the model, specifically:**
  1. **Metered, transparent billing** instead of a flat subscription — a real product-design decision (the "$20/month problem"), not just a feature checkbox.
  2. **Unified, linked knowledge base** — chat, saved links, generated documents, and reusable prompts share one database and one semantic index, instead of living in four disconnected tools.
  3. **Prompt Vault's variable system** — turns a one-off prompt into a reusable template, something no mainstream chat UI exposes to end users directly.
  4. **Suggest → review → confirm pattern** — nothing (tags, summaries, document edits) is applied silently; the user always confirms AI output before it's saved, which is a deliberate trust/control design choice worth defending in viva.
- **Is this a real-world problem?** Yes — fragmented personal knowledge (bookmarks/notes/AI chat history split across tools) and flat AI subscription pricing for light users are both documented, common pain points, not invented ones.

---

## 5. Tech Stack (100% Free-Tier)

| Layer | Choice | Free-tier notes |
|---|---|---|
| Frontend | React + Vite, SCSS modules, Zustand | $0 |
| Backend | Node.js + Express | Render free web service (cold start ~30–60s after idle — mention proactively in viva) |
| LLM | Gemini 1.5 Flash (default) + Gemini 1.5 Pro (complex tasks) | Existing free/low-cost API key; usage tracked per call for credit deduction |
| Embeddings | Gemini embedding model | Same key |
| Vector DB | Pinecone Starter (free) or ChromaDB (self-hosted) | Enough for single-user demo dataset |
| Database | MongoDB Atlas M0 | 512 MB, free forever |
| Auth | Google OAuth + JWT | $0 |
| PDF generation | `pdf-lib` (pure JS) | Chosen over Puppeteer — headless Chrome is too memory-heavy for Render's free tier |
| Payments | Razorpay **Test Mode** | No KYC needed for demo; real webhook flow, fake money |
| Charts (Admin) | Recharts or Chart.js | $0 |
| Hosting — frontend | Vercel Hobby | $0 |
| Hosting — backend | Render free web service | Known cold-start trade-off |

Only real cost risk in the entire stack: Gemini image generation, if ever added — kept out of scope for now (Future Scope), exactly to avoid this.

---

## 6. Architecture Overview

```
┌────────────────────────────┐
│   NexAI Frontend (React)   │
│  Chat / Library / Docs /   │
│  Prompt Vault / Wallet /   │
│  Admin (role-gated)        │
└─────────────┬──────────────┘
              │ HTTPS + JWT
              ▼
┌─────────────────────────────────────┐
│   Backend — Node.js + Express        │
│   (Render, free tier)                │
│                                       │
│  Routes → Controllers → Services     │
│  ┌─────────────────────────────┐     │
│  │ Credit Middleware            │     │
│  │ - reads token usage from     │     │
│  │   Gemini response            │     │
│  │ - deducts from user wallet   │     │
│  │ - blocks request if balance  │     │
│  │   = 0                        │     │
│  └─────────────┬─────────────────┘   │
│  ┌─────────────▼─────────────────┐   │
│  │ Agent Layer                  │     │
│  │ - chat agent                 │     │
│  │ - document-generation agent  │     │
│  │ - tagging/summarize agent    │     │
│  └───────────────────────────────┘   │
└───────┬──────────┬──────────┬────────┘
        ▼          ▼          ▼
   MongoDB     Pinecone/    Gemini API
   Atlas       Chroma       (Flash/Pro)
  (users,     (semantic
   wallet,     search)
   library,
   documents,
   prompts,
   transactions)
        ▲
        │ webhook
┌───────┴────────┐
│ Razorpay        │
│ (Test Mode)     │
└─────────────────┘
```

Key design decisions:
- All AI calls go through the backend — the Gemini key never touches the client.
- The Credit Middleware sits between the request and the agent layer — every AI call is metered at the source, not estimated afterward.
- Any agent action that changes stored data (save to library, auto-tag) follows **suggest → review → confirm** — nothing is silently written.

---

## 7. Data Model

```js
// users
{
  _id, email, googleId,
  role: "user" | "admin",
  wallet: {
    creditsRemaining: 100,       // free starter credits
    tier: "free" | "pro_monthly",
    totalTokensConsumed: 0
  },
  settings: {
    theme, defaultModel: "flash" | "pro",
    webSearchDefaultOn: Boolean
  },
  createdAt
}

// transactions (billing ledger)
{
  _id, userId,
  amountINR, creditsAdded,
  paymentGateway: "razorpay_test",
  paymentId, status: "success" | "failed",
  createdAt
}

// libraryItems
{
  _id, userId,
  type: "link" | "note",
  url, title, summary, tags: [String],
  vectorId,          // Pinecone/Chroma reference
  createdAt
}

// documents (AI-generated)
{
  _id, userId,
  title, category: "resume" | "report" | "notes" | "other",
  sections: [{ heading, body }],
  fileFormat: "pdf",
  createdAt
}

// prompts (Prompt Vault)
{
  _id, userId,
  title, template: String,   // e.g. "Summarize {{topic}} in {{tone}} tone"
  variables: [String],
  tags: [String],
  createdAt
}

// chats / messages
{ _id, userId, title, createdAt, updatedAt }
{ _id, chatId, role: "user" | "assistant", content, tokensUsed, createdAt }

// usageLogs (feeds Admin Dashboard)
{ _id, userId, model: "flash" | "pro", tokensUsed, creditsDeducted, createdAt }
```

---

## 8. Key Data Flows

**A. Chat message with credit deduction**
1. User sends a message → backend calls Gemini Flash/Pro with streaming enabled.
2. Response streams back to the client in real time.
3. On completion, the API response's `usage.total_tokens` is read.
4. Credit middleware converts tokens → credits (e.g. 100 tokens = 1 credit) and deducts from `wallet.creditsRemaining`.
5. A `usageLogs` entry is written for the Admin Dashboard.
6. If `creditsRemaining` reaches 0, further requests are blocked with a "Recharge to continue" response.

**B. Save to Library**
1. User pastes a link or note.
2. Backend fetches/extracts content → Gemini Flash generates summary + tags.
3. Suggested summary/tags shown for one-tap confirm/edit — never applied silently.
4. On confirm: embedding generated → upserted to vector DB → `libraryItems` doc saved.

**C. AI Document Generation**
1. User requests a document (e.g. "write me a resume").
2. Agent drafts structured sections (JSON: heading + body per section).
3. Rendered in a preview pane; user edits inline.
4. On export: `pdf-lib` renders the file → downloaded → saved to Documents.

**D. Prompt Vault use**
1. User opens the vault, picks a saved prompt.
2. If it has `{{variables}}`, a small form collects values.
3. Filled prompt is inserted into chat as the first message.

**E. Recharge (Razorpay Test Mode)**
1. User picks a plan (e.g. ₹49 → 500 credits) on the Wallet page.
2. Razorpay Test Mode checkout opens; test card/UPI completes payment.
3. Razorpay webhook hits the backend → backend verifies signature → updates `wallet.creditsRemaining` and writes a `transactions` entry.

---

## 9. Folder Structure

```
nexai/
├── client/                      # React + Vite frontend
│   ├── src/
│   │   ├── pages/                # Chat, Library, Documents, Prompts, Wallet, Admin
│   │   ├── components/
│   │   ├── store/                 # Zustand stores
│   │   ├── lib/                   # api client, auth helpers
│   │   └── styles/                # SCSS, dark theme tokens
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── models/                # Mongoose schemas
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/               # gemini.service.js, vectorDb.service.js,
│   │   │                           # pdfExport.service.js, razorpay.service.js
│   │   ├── agents/                 # chat agent, doc-gen agent, tagging agent
│   │   ├── middleware/             # creditCheck.middleware.js
│   │   └── app.js
│   └── package.json
│
├── docs/
│   ├── PRD.md                     # this file
│   └── viva-prep.md
│
└── README.md
```

---

## 10. Free-Tier Reality Check

| Service | Free limit | Practical impact |
|---|---|---|
| MongoDB Atlas M0 | 512 MB, free forever | Enough for thousands of records across all collections |
| Pinecone Starter / Chroma | 2 GB / self-hosted | Comfortably covers a single-user demo dataset |
| Render free web service | 750 instance-hrs/mo, ~30–60s cold start after idle | Mention proactively in viva as a known trade-off |
| Vercel Hobby | Generous static hosting | $0 |
| Razorpay Test Mode | Unlimited test transactions | No real money, no KYC needed for demo |
| Gemini API | Existing key | Text generation + embeddings already covered |

Everything in this scope runs at $0 beyond the Gemini key already available.

---

## 11. Build Roadmap (Practical Order)

1. **Backend scaffold** — `/server` + `/client`, base configs, `.env.example` → commit to `main` → branch `dev`
2. **`feature/backend-chat`** — `/api/chat` route, Gemini streaming (SSE), token-based credit deduction, tested via Postman/curl
3. **`feature/chat-ui`** — streaming chat UI with a live credit badge
4. **`feature/library`** — save + summarize + tag + semantic search
5. **`feature/prompt-vault`** and **`feature/doc-gen`** — Phase 1 differentiators
6. **`feature/wallet-billing`** — Razorpay Test Mode integration + transaction ledger
7. **`feature/admin-dashboard`** — token/usage charts, mock revenue, error log count
8. Phase 3 items only if time remains before submission

**Viva rule of thumb:** Phase 0–1 fully working, Phase 2 (SaaS layer) at least demoable end-to-end (one real test recharge, one admin chart), Phase 3 optional.

---

## 12. Viva Q&A Prep

- **"Isn't this just an API wrapper?"** — The value is the credit-metering pipeline (real token accounting, not a flat counter), the retrieval pipeline (embeddings across chat/library/documents), the Prompt Vault's variable system, and the suggest→confirm pattern — none of that is "just calling an API."
- **"Why not just use ChatGPT/Gemini directly?"** — Because those are flat-subscription, single-purpose chat windows. NexAI is a metered, unified personal knowledge workspace where chat, saved knowledge, generated documents, and reusable prompts share one searchable database.
- **"Is this a real-world problem?"** — Yes, two of them: fragmented personal knowledge across tools, and flat AI subscription pricing that overcharges light users — both are common, documented pain points.
- **"Why Razorpay Test Mode and not a real payment gateway?"** — To demonstrate the full webhook → credit-ledger flow without needing KYC or real transactions for an academic project; the integration code is production-identical, only the mode differs.
- Be ready to explain: why token-based credit deduction instead of a flat per-message charge, why a vector DB over plain keyword search, and what was personally designed vs what the API/library provides.
