# NexAI: Agent Build Guide (use together with NexAI-PRD-v2.md)

## 0. How to use this guide

- The PRD (`NexAI-PRD-v2.md`) is the source of truth for WHAT to build. This guide is the source of truth for HOW.
- If they conflict, the PRD wins on scope. This guide wins on structure, conventions and code quality.
- Build strictly phase by phase (Section 12). Do not start a phase until the previous phase meets its acceptance criteria.
- Never build items listed under "Future Scope" in the PRD.
- Never invent requirements. If something is unclear, choose the simplest option that fits the PRD and note it in `docs/decisions.md`.

## 1. Golden rules

1. The Gemini API key, Razorpay secret and JWT secrets exist ONLY on the server. The client never calls Gemini directly.
2. Every AI call goes through `creditCheck` middleware and the credit service, with no exceptions (chat, library suggest, doc generation).
3. Suggest, review, confirm: AI output (summaries, tags, document sections) is shown to the user first and saved only after the user confirms.
4. The UI uses design tokens only. No hard-coded colors, font sizes, spacing, radii or shadows in component styles.
5. Pages are built from reusable components in `components/ui`. If a UI pattern appears twice, extract it into a component.
6. Keep the layering: routes, then controllers, then services. Controllers stay thin, and business logic lives in services.
7. Validate every request body, query and param on the server.
8. No placeholder code, no TODO stubs in merged work, no commented-out code.
9. Commit small, focused changes with clear messages (Conventional Commits).

## 2. Tech stack and packages

Use these packages (verify the latest stable versions on npm before installing):

**Client:** `react`, `react-dom`, `vite`, `@vitejs/plugin-react`, `react-router-dom`, `zustand`, `axios`, `sass`, `clsx`, `lucide-react` (icons), `recharts` (admin charts), `@react-oauth/google`, `react-markdown` (render assistant messages).

**Server:** `express`, `mongoose`, `dotenv`, `cors`, `helmet`, `cookie-parser`, `express-rate-limit`, `zod`, `jsonwebtoken`, `bcryptjs`, `google-auth-library`, the Google Gemini SDK (`@google/genai` or `@google/generative-ai`, whichever is current), `@pinecone-database/pinecone`, `pdf-lib`, `razorpay`, `cheerio` (extract link content), `pino` or `morgan` (logging).

**Dev:** `eslint`, `prettier`, `nodemon`, `vitest` (client), `jest` or `vitest` + `supertest` (server).

Model names must come from env variables (`GEMINI_FLASH_MODEL`, `GEMINI_PRO_MODEL`, `GEMINI_EMBED_MODEL`), never hard-coded, because model versions change.

## 3. Repository structure (monorepo)

```
/
├── client/
│   ├── index.html
│   ├── vite.config.js
│   ├── .env.example
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── router/
│       │   ├── index.jsx              # route table
│       │   ├── ProtectedRoute.jsx
│       │   └── AdminRoute.jsx
│       ├── layouts/
│       │   ├── AppLayout/             # unified collapsible sidebar (64px/260px) + topbar + outlet
│       │   └── AuthLayout/
│       ├── pages/
│       │   ├── Auth/ (Login, Register)
│       │   ├── Chat/                  # full-width hero & streaming conversation canvas
│       │   ├── Library/               # consolidated hub: notes, links, docs, files, interviews
│       │   ├── Prompts/
│       │   ├── Interview/             # AI mock interview: setup, live arena, scorecard
│       │   ├── Search/
│       │   ├── Wallet/
│       │   ├── Settings/
│       │   ├── Admin/
│       │   └── NotFound/
│       ├── features/                  # feature-specific components
│       │   ├── chat/ (MessageList, MessageBubble, Composer, VoiceInput, PromptHero)
│       │   ├── library/ (SaveItemForm, SuggestionReview, LibraryCard, DocViewer, FileUploader)
│       │   ├── prompts/ (PromptForm, VariableFillModal, PromptCard)
│       │   ├── interview/ (InterviewSetup, InterviewArena, VoiceRipple, TranscriptDrawer, Scorecard)
│       │   ├── wallet/ (PlanCard, TransactionTable, CreditBadge)
│       │   ├── admin/ (StatCard, UsageChart, ModelSplitChart)
│       │   └── command-palette/ (CommandPalette)
│       ├── components/
│       │   ├── ui/                    # design-system primitives (Section 5)
│       │   └── common/                # PageHeader, SearchBar, ConfirmDialog, ErrorBoundary
│       ├── store/                     # Zustand: auth, chat, library, prompts, interview, wallet, ui
│       ├── lib/
│       │   ├── api/                   # axios instance + one file per domain (chat, library, interview...)
│       │   ├── sse.js                 # fetch-based SSE stream reader
│       │   ├── auth.js
│       │   └── utils/                 # formatDate, extractVariables, fillTemplate, cn
│       ├── hooks/                     # useDebounce, useHotkey, useTheme, useStream, useSpeechRecognition
│       ├── constants/                 # routes, plans, query keys
│       └── styles/
│           ├── tokens/ (_primitives.scss, _semantic.scss, _index.scss)
│           ├── themes/ (_dark.scss, _light.scss)
│           ├── abstracts/ (_mixins.scss, _functions.scss, _breakpoints.scss)
│           ├── base/ (_reset.scss, _typography.scss, _globals.scss)
│           └── main.scss
│
├── server/
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── server.js                  # starts http server
│       ├── app.js                     # express app, middleware, routes
│       ├── config/ (env.js [zod-validated env], db.js, gemini.js, pinecone.js, razorpay.js)
│       ├── models/ (User, Transaction, LibraryItem, Prompt, Chat, Message, InterviewSession, UsageLog, ErrorLog)
│       ├── routes/ (index.js + one file per domain)
│       ├── controllers/
│       ├── services/
│       ├── agents/ (prompts/ for interview, doc-gen, chat, library)
│       │   ├── gemini.service.js      # generate, stream, embed
│       │   ├── vectorDb.service.js    # upsert, query, delete (provider-agnostic interface)
│       │   ├── credit.service.js      # tokensToCredits, assertBalance, deduct (atomic)
│       │   ├── pdfExport.service.js
│       │   ├── razorpay.service.js
│       │   ├── linkExtractor.service.js
│       │   └── search.service.js
│       ├── agents/ (chat.agent.js, docGen.agent.js, tagging.agent.js, prompts/ [system prompts])
│       ├── middleware/ (auth, requireRole, creditCheck, validate, rateLimit, errorHandler, requestLogger)
│       ├── validators/                # zod schemas per domain
│       ├── utils/ (ApiError.js, asyncHandler.js, logger.js, sse.js)
│       └── scripts/ (seedAdmin.js)
│
├── docs/ (PRD.md, decisions.md, api.md, viva-prep.md)
├── .editorconfig
├── .prettierrc
├── .gitignore
└── README.md
```

## 4. Design tokens (the single source of UI consistency)

Use two layers:

- **Primitives** are raw values, e.g. `--color-violet-500`.
- **Semantic tokens** describe what a value is for, e.g. `--color-bg-surface` or `--color-text-primary`.

Components may use semantic tokens ONLY. Themes change semantic tokens by swapping the `[data-theme]` attribute on `<html>`.

**`styles/tokens/_primitives.scss`**

```scss
:root {
  // Colors
  --gray-0: #ffffff;
  --gray-50: #f7f7f9;
  --gray-100: #eceef2;
  --gray-200: #d9dce3;
  --gray-400: #9aa1ae;
  --gray-500: #6b7280;
  --gray-700: #2a2f3a;
  --gray-800: #1c2029;
  --gray-850: #161a22;
  --gray-900: #0f1217;
  --gray-950: #0a0c10;
  --violet-400: #a78bfa;
  --violet-500: #8b5cf6;
  --violet-600: #7c3aed;
  --green-500: #22c55e;
  --amber-500: #f59e0b;
  --red-500: #ef4444;
  --blue-500: #3b82f6;

  // Spacing (4px scale)
  --space-0: 0;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  // Typography
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
  --text-xs: 12px;
  --text-sm: 14px;
  --text-md: 16px;
  --text-lg: 18px;
  --text-xl: 20px;
  --text-2xl: 24px;
  --text-3xl: 30px;
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.7;

  // Radii, motion, layers
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;
  --radius-full: 9999px;
  --duration-fast: 120ms;
  --duration-base: 200ms;
  --duration-slow: 320ms;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-modal: 400;
  --z-toast: 500;
  --z-palette: 600;

  // Layout
  --sidebar-width: 248px;
  --topbar-height: 56px;
  --content-max: 1200px;
}
```

**`styles/themes/_dark.scss`** (default) and **`_light.scss`** define the SAME semantic names:

```scss
:root,
[data-theme='dark'] {
  --color-bg-app: var(--gray-950);
  --color-bg-surface: var(--gray-900);
  --color-bg-elevated: var(--gray-850);
  --color-bg-hover: var(--gray-800);
  --color-border: var(--gray-700);
  --color-text-primary: var(--gray-50);
  --color-text-secondary: var(--gray-400);
  --color-text-muted: var(--gray-500);
  --color-accent: var(--violet-500);
  --color-accent-hover: var(--violet-400);
  --color-accent-contrast: var(--gray-0);
  --color-success: var(--green-500);
  --color-warning: var(--amber-500);
  --color-danger: var(--red-500);
  --color-info: var(--blue-500);
  --color-focus-ring: color-mix(in srgb, var(--violet-500) 55%, transparent);
  --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.4);
  --shadow-md: 0 6px 20px rgb(0 0 0 / 0.45);
  --shadow-lg: 0 16px 48px rgb(0 0 0 / 0.55);
}
[data-theme='light'] {
  --color-bg-app: var(--gray-50);
  --color-bg-surface: var(--gray-0);
  --color-bg-elevated: var(--gray-0);
  --color-bg-hover: var(--gray-100);
  --color-border: var(--gray-200);
  --color-text-primary: var(--gray-900);
  --color-text-secondary: var(--gray-500);
  --color-text-muted: var(--gray-400);
  --color-accent: var(--violet-600);
  --color-accent-hover: var(--violet-500);
  --color-accent-contrast: var(--gray-0);
  // success/warning/danger/info unchanged; softer shadows
  --shadow-sm: 0 1px 2px rgb(16 24 40 / 0.06);
  --shadow-md: 0 6px 20px rgb(16 24 40 / 0.08);
  --shadow-lg: 0 16px 48px rgb(16 24 40 / 0.12);
}
```

**`styles/abstracts/_breakpoints.scss`**

```scss
$breakpoints: (
  sm: 640px,
  md: 768px,
  lg: 1024px,
  xl: 1280px,
);
@mixin up($bp) {
  @media (min-width: map-get($breakpoints, $bp)) {
    @content;
  }
}
@mixin focus-ring {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}
```

Rules:

- Theme switching: set `document.documentElement.dataset.theme`, store the choice in the `ui` Zustand store and in user settings, and default to dark.
- Every SCSS module starts with `@use "@/styles/abstracts" as *;` (set up a Vite alias `@` pointing to `src`).
- Adding a new color or size means adding a token first, never a raw value in a component.

## 5. UI component library (`components/ui`)

Each component lives in its own folder with `Component.jsx`, `Component.module.scss` and `index.js`. Components accept `className`, forward refs where relevant, and support keyboard use and ARIA attributes.

| Component         | Required API                                                                                                                      |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Button            | `variant: primary \| secondary \| ghost \| danger`, `size: sm \| md \| lg`, `loading`, `leftIcon`, `rightIcon`, `fullWidth`, `as` |
| IconButton        | `icon`, `label` (aria-label), `size`, `variant`                                                                                   |
| Input / Textarea  | `label`, `hint`, `error`, `leftIcon`, `autoResize` (Textarea)                                                                     |
| Select            | `options`, `value`, `onChange`, `label`, `error`                                                                                  |
| Card              | `padding`, `interactive`, with `Card.Header` / `Card.Body` / `Card.Footer`                                                        |
| Modal             | `open`, `onClose`, `title`, `footer`, focus trap, closes on Esc, portal                                                           |
| Drawer            | same as Modal, slides in from the side (mobile sidebar)                                                                           |
| Badge             | `tone: neutral \| accent \| success \| warning \| danger`                                                                         |
| Tag               | `label`, `removable`, `onRemove`                                                                                                  |
| TagInput          | add tags with Enter or comma, remove with a click or Backspace                                                                    |
| Tabs              | `items`, `value`, `onChange`, arrow-key navigation                                                                                |
| Dropdown / Menu   | trigger + items, keyboard navigable                                                                                               |
| Tooltip           | `content`, `side`                                                                                                                 |
| Toast             | global `toast.success/error/info()` via `ui` store, auto-dismiss                                                                  |
| Spinner, Skeleton | `size`; Skeleton has `width`, `height`, `radius`                                                                                  |
| EmptyState        | `icon`, `title`, `description`, `action`                                                                                          |
| Avatar            | `src`, `name` (initials fallback)                                                                                                 |
| Switch            | `checked`, `onChange`, `label`                                                                                                    |
| Kbd               | shows keyboard shortcuts like Ctrl K                                                                                              |

Common components: `PageHeader` (title, description, actions), `SearchBar`, `ConfirmDialog`, `ErrorBoundary`, `CreditBadge`.

## 6. Frontend architecture rules

- **Routing:** `/login`, `/register`, `/chat`, `/chat/:chatId`, `/library`, `/documents`, `/documents/:id`, `/prompts`, `/search`, `/wallet`, `/settings`, `/admin` (AdminRoute). Load pages lazily with `React.lazy` + `Suspense`.
- **State:** one Zustand store per domain. Stores hold state and actions, and actions call `lib/api/*`. Components never call axios directly.
- **API client:** a single axios instance with `baseURL` from `VITE_API_URL` and `withCredentials: true`. A request interceptor attaches the access token. A response interceptor refreshes the token once on a 401 and retries, then logs the user out if the refresh fails. Errors are normalized to `{ code, message, details }`.
- **Streaming:** use `fetch` + `ReadableStream` in `lib/sse.js`, because EventSource cannot send POST requests or auth headers. Parse the SSE events defined in Section 8.
- **Command palette (Ctrl/Cmd+K):** a global hotkey opens a modal with fuzzy search over navigation commands, recent chats and saved prompts. Arrow keys move the selection, Enter runs the command and Esc closes the palette.
- **Layout:** sidebar (nav, recent chats, user menu) + topbar (page title, search trigger, CreditBadge, theme toggle). On screens smaller than `md`, the sidebar becomes a Drawer.
- **UX states:** every data view has loading (Skeleton), empty (EmptyState), error (message + retry) and success states.
- **Accessibility:** semantic HTML, visible focus rings, labels on all inputs, and color contrast that meets WCAG AA in both themes.

## 7. Backend architecture rules

- **Request flow:** `route → validate(zodSchema) → auth → [requireRole] → [creditCheck] → controller → service(s)/agent`.
- **Errors:** throw `new ApiError(status, code, message, details)`. Wrap controllers in `asyncHandler`. A single `errorHandler` returns `{ error: { code, message, details } }` and writes an `ErrorLog` document for status 500 and above.
- **Success responses:** `{ data, meta? }`.
- **Env:** validate `process.env` with zod in `config/env.js` and fail fast at startup.
- **Security:** `helmet`, CORS allowlist from `CLIENT_URL`, a JSON body size limit, `express-rate-limit` (stricter on auth and AI routes), and bcrypt passwords (cost 10 to 12).
- **Auth:**
  - Access JWT (15 minutes, sent as a Bearer token and kept in memory on the client).
  - Refresh JWT (7 days) in an httpOnly cookie with `SameSite=None; Secure` in production (the client on Vercel and the server on Render are on different domains).
  - Google login verifies the ID token with `google-auth-library`.
- **Request logging:** `requestLogger` records latency per request. Keep aggregate counts for the admin dashboard (error count and average latency).
- **Mongo:** add indexes on `userId`, `createdAt` and `chatId`, plus text indexes on library (title, summary, tags), documents (title, sections.body) and prompts (title, template, tags).

### Credit system (core logic, write unit tests)

- `CREDITS_PER_100_TOKENS = 1` (configurable in env). Use `credits = Math.ceil(totalTokens / 100)`.
- `creditCheck` middleware: if `wallet.creditsRemaining <= 0`, respond `402 { code: "INSUFFICIENT_CREDITS", message: "Recharge to continue" }`.
- After the AI call finishes, read the token counts from Gemini's `usageMetadata` (prompt + candidates = total tokens). Then, in one atomic update, decrement `creditsRemaining` by the credit amount (never below 0) and increment `totalTokensConsumed`. Write a `UsageLog { userId, model, feature: "chat"|"library"|"docgen", tokensUsed, creditsDeducted }`.
- Store `tokensUsed` on the assistant `Message`.

### Agents

- `chat.agent`: builds the conversation history (last N messages trimmed to a token budget), adds the system prompt and streams the reply.
- `tagging.agent`: gets link or note text and returns JSON `{ title, summary, tags[] }` (3 to 6 lowercase tags). Use Gemini JSON output mode and validate it with zod.
- `docGen.agent`: gets a request + category and returns JSON `{ title, category, sections: [{ heading, body }] }`, validated with zod.
- System prompts live in `agents/prompts/*.js`, not inline in the agent code.

### Vector DB

- `vectorDb.service` exposes `upsert({ id, values, metadata })`, `query({ values, topK, filter })` and `remove(id)`. Implement it for Pinecone first. Keep the interface provider-agnostic so Chroma can be dropped in later.
- Metadata: `{ userId, type: "library"|"document"|"prompt", refId }`. ALWAYS filter by `userId`.
- If a vector write fails, the Mongo record still saves, is marked `vectorId: null` and gets logged.

## 8. API contract (document it in `docs/api.md`)

All routes are prefixed with `/api` and require auth unless marked public.

**Auth:** `POST /auth/register` (public), `POST /auth/login` (public), `POST /auth/google` (public), `POST /auth/refresh` (public, uses the cookie), `POST /auth/logout`, `GET /auth/me`

**Users:** `PATCH /users/me/settings` `{ theme, defaultModel, webSearchDefaultOn }`

**Chat:**

- `GET /chats`, `POST /chats`, `PATCH /chats/:id` (title), `DELETE /chats/:id`
- `GET /chats/:id/messages`
- `POST /chats/:id/messages` `{ content, model? }` returns an **SSE stream** (creditCheck):
  - `event: token` → `{ "text": "..." }`
  - `event: done` → `{ "messageId", "tokensUsed", "creditsDeducted", "creditsRemaining" }`
  - `event: error` → `{ "code", "message" }`
  - The first user message automatically sets the chat title (a short Flash call, also metered).

**Library (Consolidated Knowledge Hub):**

- `POST /library/suggest` `{ type, url?, content? }` returns `{ title, summary, tags }` and does NOT save (creditCheck)
- `POST /library` `{ type, url?, content?, title, summary, tags, sections?, fileUrl? }` saves confirmed item (`link`, `note`, `document`, `file`, `interview`) and embeds it
- `GET /library?type=&tag=&page=`, `PATCH /library/:id`, `DELETE /library/:id` (also removes the vector)
- `GET /library/search?q=` runs a semantic search across all items
- `POST /library/documents/generate` `{ prompt, category }` returns a structured draft that is not saved (creditCheck)
- `GET /library/documents/:id/export.pdf` streams the PDF made by `pdf-lib`

**AI Interview Platform:**

- `POST /interview/start` `{ role, difficulty, topic }` creates a session, drafts initial greeting and question (creditCheck)
- `POST /interview/:id/respond` `{ content, model? }` returns an **SSE stream** with the interviewer's critique and next question (creditCheck)
- `POST /interview/:id/conclude` evaluates the candidate's transcript, computes multi-criteria scorecard (overall score, strengths, areas for growth), deducts credits, and auto-saves the result into the Library
- `GET /interview` lists past interview sessions for the logged-in user
- `GET /interview/:id` returns specific session transcript and scorecard

**Prompts:** `GET /prompts?q=&tag=`, `POST /prompts`, `PATCH /prompts/:id`, `DELETE /prompts/:id`. Variables are extracted on the server from `{{name}}` with the regex `/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g` (deduplicated).

**Unified search:** `GET /search?q=` returns `{ library: [], prompts: [] }`, merging Mongo text search and vector results, deduplicated and ranked.

**Wallet:**

- `GET /wallet`: balance, tier, total tokens
- `GET /wallet/plans`: plans come from server config, never from the client
- `POST /wallet/orders` `{ planId }` creates a Razorpay order and returns `{ orderId, amount, currency, keyId }`
- `POST /wallet/verify` `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }` does an HMAC check and credits the wallet
- `GET /wallet/transactions`
- `POST /webhooks/razorpay` (public). Use `express.raw()` on this route ONLY and verify `X-Razorpay-Signature` with `RAZORPAY_WEBHOOK_SECRET`.
- **Idempotency:** a unique index on `transactions.paymentId`, so a payment is credited only once whether verify or the webhook arrives first.

**Admin** (`requireRole("admin")`): `GET /admin/stats` (total tokens, total users, mock revenue, error count, average latency), `GET /admin/usage?range=7d|30d` (daily token series + Flash vs Pro split), `GET /admin/transactions?page=`, `GET /admin/errors?page=`

## 9. Data models

Follow PRD Section 7 exactly, plus:

- `Message.tokensUsed`
- `UsageLog.feature` (`chat` | `library` | `interview` | `document`)
- `LibraryItem.type` (`link` | `note` | `document` | `file` | `interview`)
- `LibraryItem.content` (extracted text, note markdown, or document sections)
- `LibraryItem.interviewData` (session ID, role, score, rating)
- `InterviewSession` (`userId`, `role`, `difficulty`, `topic`, `status`, `messages`, `scorecard`, `totalTokensUsed`)
- `Transaction.orderId`
- `Transaction.planId`
- An `ErrorLog { route, method, status, message, stack?, userId?, createdAt }` collection (it feeds the admin error count)

Add Mongoose `timestamps: true` to all models. The user's password hash field is `select: false`.

## 10. Environment variables

**server/.env.example**

```
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
GOOGLE_CLIENT_ID=
GEMINI_API_KEY=
GEMINI_FLASH_MODEL=
GEMINI_PRO_MODEL=
GEMINI_EMBED_MODEL=
PINECONE_API_KEY=
PINECONE_INDEX=nexai
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
CREDITS_PER_100_TOKENS=1
STARTER_CREDITS=100
ADMIN_EMAIL=
ADMIN_PASSWORD=
```

**client/.env.example**

```
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=
VITE_RAZORPAY_KEY_ID=
```

## 11. Code conventions & Git workflow

- JavaScript (ESM) on both sides. JSDoc on services and agents.
- File names: `PascalCase.jsx` for components, `camelCase.js` for utilities, `name.service.js` / `name.controller.js` / `name.routes.js` / `Name.model.js` on the server.
- Keep functions small (under about 40 lines where possible). No magic numbers: put them in constants or env.
- ESLint + Prettier (2 spaces, single quotes, semicolons, trailing commas, 100 character lines).
- Root `package.json` scripts: `dev` (runs client and server together), `lint`, `format`, `test`.
- **Git Branching Lifecycle (Strictly Followed):**
  1. Always branch from `dev`: `git checkout dev && git checkout -b feature/<name>`
  2. Work in small, verifiable steps. Write complete runnable code (no stubs or TODOs).
  3. Run linter and tests: `npm run lint` and `npm test`. Fix any regressions.
  4. Commit with Conventional Commits (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`).
  5. Merge into `dev` branch: `git checkout dev && git merge --no-ff feature/<name>`
  6. Verify `dev` branch compiles and tests pass.
  7. Delete the feature branch: `git branch -d feature/<name>`.
  8. `main` branch remains untouched until ready for production deployment.

## 12. Build order with acceptance criteria

**Step 1: Scaffold and design system** (`feature/scaffold`) — `[COMPLETED]`
- Monorepo, tooling, env validation, DB connection, `/api/health`, error handling, logging.
- All tokens, both themes, base styles and every `components/ui` component, plus AppLayout, routing, the auth pages and the command palette shell.

**Step 2: Auth** (`feature/auth`) — `[COMPLETED]`
- Register, login, Google login, refresh, logout, `me`, protected and admin routes, `seedAdmin` script, 100 starter credits.

**Step 3: Backend chat** (`feature/backend-chat`) — `[COMPLETED]`
- Gemini streaming over SSE, chat and message persistence, creditCheck, atomic deduction, UsageLog.

**Step 4: Chat UI** (`feature/chat-ui`) — `[COMPLETED]`
- Streaming message view (markdown and code blocks with a copy button), composer (Enter to send, Shift+Enter for a new line), model picker, stop button, live CreditBadge, and "Recharge" call to action on 402.

**Step 5: Library Core** (`feature/library`) — `[COMPLETED]`
- Link or note input, suggest step, review screen (edit title, summary, tags), vector embedding via `vectorDb.service.js`, hybrid search, and delete.

---

**Step 6: Unified Collapsible Sidebar, Minimalist Chat Canvas & Project Workspaces** (`feature/sidebar-and-hero-ui`) — `[COMPLETED]`
- Single collapsible sidebar (64px icon rail / 260px expanded panel) replacing the duplicate nested chat sub-sidebar in `ChatPage`.
- Direct integration of `+ New chat`, `Search chats` live filter, primary navigation items, and recent conversation history list (with rename, pin, and delete actions) inside the sidebar.
- Gemini-inspired distraction-free chat canvas: "Where should we start?" hero state with glowing prompt bar, voice input (mic button using Web Speech API), model selection dropdown (Flash/Pro), and quick starter suggestion chips.
- ChatGPT-style **Project Workspaces**:
  - Full CRUD routes (`/api/projects`), Mongoose `Project` model with custom instructions, color tags, and local source file knowledge grounding.
  - Multi-source knowledge base injection into Gemini agent system instructions (up to 50k chars per source).
  - Isolated project chat conversations (`Chat.projectId`), project gallery (`/projects`), and workspace canvas (`/projects/:id`) with 2MB capacity tracking.
  - Collapsible Projects section in the sidebar with instant project switching, chat movement, and direct project-scoped chat initiation.
- Done when: Sidebar smoothly collapses to 64px and expands to 260px; New Chat creates a session without extra sub-sidebars; hero state renders when chat is empty; voice dictation inputs text into composer; projects isolate instructions and sources; tests (114 passing) & lint (0 errors, 0 warnings) pass.

**Step 7: Prompt Vault & In-Chat Template Integration** (`feature/prompt-vault`) — `[COMPLETED]`
- Full CRUD for prompt templates (`/api/prompts`), Mongoose `Prompt` model with title, description, template, tags, variables, and favorite toggle.
- Real-time variable auto-extraction and bracket whitespace trimming with regex `/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g`.
- In-chat template integration:
  - "Save to Prompt Vault" action button on both user and assistant message bubbles.
  - "Use Prompt" template trigger in `ChatInput` composer and `ChatHero` capsule.
  - `VariableFillModal` with live preview of parameter substitution, clipboard copying, and direct insertion into chat with focus and cursor persistence.
- Done when: Users can manage prompt templates in `/prompts`, filter by tags and favorites, fill variables in real-time modal, save chat messages directly to vault, and inject compiled templates into chat; all tests (137 passing) & lint (0 errors) pass.

---

### Upcoming Build Steps


**Step 8: Consolidated Library & Document Management** (`feature/consolidated-library`) — `[COMPLETED]`
- Unify Documents and Library into one centralized knowledge hub with tabbed filtering: `All`, `Notes & Links`, `Documents`, `Files`, `Interviews`.
- Structured AI document generator (resumes, project specs, reports) with split-pane live preview, inline editing, and client-side PDF export (`pdf-lib`).
- Custom local file uploads (PDF/text/markdown) saved to the Library.
- Chat composer attachment picker: select existing library items or upload local files as chat context.
- Done when: Structured docs can be generated and exported to PDF; files can be uploaded and attached to chat prompts; all items appear in their respective Library tabs.

**Step 9: AI Interview Platform** (`feature/ai-interview`) — `[COMPLETED]`
- Dedicated `/interview` route with Setup view (Role, Seniority, Viva / Capstone Defense, and Topic selection).
- Live interactive simulation arena:
  - Gemini acts as an experienced Technical Lead or Viva Examiner with turn-by-turn challenges and follow-ups.
  - Interactive **Voice Ripple / Audio Visualizer** animation responding to speech activity for candidate and AI.
  - Speech-to-Text (voice dictation) and Text-to-Speech audio support.
  - Live collapsible transcript tray showing full turn history.
- Performance Evaluation & Scorecard:
  - Comprehensive report at conclusion: Overall Score (0-100), rating, category breakdown (Technical Accuracy, Problem Solving, Communication, System Design), key strengths, and areas to improve.
  - Automatic archival of the scorecard and transcript into the **Library** under the `interview` category.
  - Metered with `creditCheck` and atomic token deduction: $\lceil \text{totalTokens} / 100 \rceil$.
- Done when: A complete mock interview runs from setup to evaluation, voice visualizer animates, transcript tracks turns, scorecard is saved in Library, and credit balance updates accurately.

**Step 10: Unified Search & Command Palette** (`feature/search`) — `[COMPLETED]`
- Cross-domain hybrid search engine combining vector embeddings (`geminiService` + `vectorDbService`) and MongoDB full-text / regex search across Library, Prompts, and Chats.
- Dedicated `/search` page with category tabs (`All`, `Library`, `Prompts`, `Chats`), live counts, debounced search, highlighted snippet matches, and recent search caching.
- Enhanced global Command Palette (Ctrl+K) performing live hybrid search across chats, prompts, and library items alongside fast navigation actions.
- Done when: Ctrl+K or `/search` quickly navigates to any item or screen across the workspace; all unit & integration tests pass with strict user scoping.

---

**Step 11: Wallet & Billing** (`feature/wallet-billing`) — `[COMPLETED]`
- Plans, Razorpay Checkout integration in test mode, HMAC verification endpoint, raw body webhook handler, and idempotent transaction ledger.
- Server-defined plans (`server/src/config/plans.js`) ensuring prices and credits are never determined by the client.
- Raw body webhook parser mounted exclusively before `express.json()` at `/api/webhooks/razorpay`.
- Concurrency-safe atomic transaction ledger preventing double-credits on simultaneous webhook and verify requests.
- Full wallet frontend (`/wallet`) with balance overview, plan cards, test mode quick-recharge, and paginated transaction ledger.
- Done when: A test card recharge adds credits exactly once, even if both webhook and verify arrive simultaneously; unit and integration tests verify idempotency.

---

### Upcoming Build Steps

**Step 12: Admin Dashboard** (`feature/admin-dashboard`)
- Role-gated `/admin` route with stat cards (tokens, mock revenue, active users), token consumption charts, Flash vs Pro model split, recent transactions, and error logs.
- Done when: Admin users can monitor platform usage in real-time while non-admins are restricted (HTTP 403).

**Step 13: Hardening & Viva Prep** (`feature/hardening`)
- Integration tests with Supertest, end-to-end flow validation, deployment guides for Render/Vercel, and comprehensive viva defense preparation guide (`docs/viva-prep.md`).

Phase 3 items (file analysis, developer utilities, flashcards) are built ONLY if explicitly requested after Step 11.

## 13. Definition of done (every feature)

- Works end to end against a real backend, with no mock data in the UI.
- Loading, empty, error and success states exist, and the feature works in both themes.
- No hard-coded style values. Only reusable components are used.
- Server input is validated, errors are handled, and data is always scoped to the logged-in user.
- AI calls are metered and logged.
- Lint and tests pass, and the README or `docs/api.md` are updated if anything changed.

## 14. Do NOT

- Call Gemini, Pinecone or Razorpay secrets from the client.
- Save AI output without user confirmation.
- Trust prices or credit amounts sent by the client.
- Use Puppeteer or headless browsers (use pdf-lib).
- Add UI libraries such as MUI, Chakra or Tailwind (the design system is custom, built with SCSS and tokens).
- Build anything under "Future Scope" in the PRD.
