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
│       │   ├── AppLayout/             # sidebar + topbar + outlet
│       │   └── AuthLayout/
│       ├── pages/
│       │   ├── Auth/ (Login, Register)
│       │   ├── Chat/
│       │   ├── Library/
│       │   ├── Documents/
│       │   ├── Prompts/
│       │   ├── Search/
│       │   ├── Wallet/
│       │   ├── Settings/
│       │   ├── Admin/
│       │   └── NotFound/
│       ├── features/                  # feature-specific components
│       │   ├── chat/ (MessageList, MessageBubble, Composer, ChatSidebar)
│       │   ├── library/ (SaveItemForm, SuggestionReview, LibraryCard)
│       │   ├── documents/ (DocGenerator, SectionEditor, DocPreview)
│       │   ├── prompts/ (PromptForm, VariableFillModal, PromptCard)
│       │   ├── wallet/ (PlanCard, TransactionTable, CreditBadge)
│       │   ├── admin/ (StatCard, UsageChart, ModelSplitChart)
│       │   └── command-palette/ (CommandPalette)
│       ├── components/
│       │   ├── ui/                    # design-system primitives (Section 5)
│       │   └── common/                # PageHeader, SearchBar, ConfirmDialog, ErrorBoundary
│       ├── store/                     # Zustand: auth, chat, library, documents, prompts, wallet, ui
│       ├── lib/
│       │   ├── api/                   # axios instance + one file per domain (chat.api.js, ...)
│       │   ├── sse.js                 # fetch-based SSE stream reader
│       │   ├── auth.js
│       │   └── utils/                 # formatDate, extractVariables, fillTemplate, cn
│       ├── hooks/                     # useDebounce, useHotkey, useTheme, useStream, useClickOutside
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
│       ├── models/ (User, Transaction, LibraryItem, Document, Prompt, Chat, Message, UsageLog, ErrorLog)
│       ├── routes/ (index.js + one file per domain)
│       ├── controllers/
│       ├── services/
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

**Library:**

- `POST /library/suggest` `{ type, url?, content? }` returns `{ title, summary, tags }` and does NOT save (creditCheck)
- `POST /library` `{ type, url?, content?, title, summary, tags }` saves the confirmed item and embeds it
- `GET /library?tag=&page=`, `PATCH /library/:id`, `DELETE /library/:id` (also removes the vector)
- `GET /library/search?q=` runs a semantic search

**Documents:**

- `POST /documents/generate` `{ prompt, category }` returns a draft that is not saved (creditCheck)
- `POST /documents`, `GET /documents`, `GET /documents/:id`, `PATCH /documents/:id`, `DELETE /documents/:id`
- `GET /documents/:id/export.pdf` streams the PDF made by `pdf-lib`. Exporting also saves the document if it is new.

**Prompts:** `GET /prompts?q=&tag=`, `POST /prompts`, `PATCH /prompts/:id`, `DELETE /prompts/:id`. Variables are extracted on the server from `{{name}}` with the regex `/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g` (deduplicated).

**Unified search:** `GET /search?q=` returns `{ library: [], documents: [], prompts: [] }`, merging Mongo text search and vector results, deduplicated and ranked.

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
- `UsageLog.feature`
- `LibraryItem.content` (the extracted text)
- `Document.updatedAt`
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

## 11. Code conventions

- JavaScript (ESM) on both sides. JSDoc on services and agents.
- File names: `PascalCase.jsx` for components, `camelCase.js` for utilities, `name.service.js` / `name.controller.js` / `name.routes.js` / `Name.model.js` on the server.
- Keep functions small (under about 40 lines where possible). No magic numbers: put them in constants or env.
- ESLint + Prettier (2 spaces, single quotes, semicolons, trailing commas, 100 character lines).
- Root `package.json` scripts: `dev` (runs client and server together), `lint`, `format`, `test`.
- Git: branch from `dev` as `feature/<name>`, use Conventional Commits (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`), and open one merge request per phase or feature into `dev`.

## 12. Build order with acceptance criteria

**Step 1: Scaffold and design system** (`feature/scaffold`)

- Monorepo, tooling, env validation, DB connection, `/api/health`, error handling, logging.
- All tokens, both themes, base styles and every `components/ui` component, plus AppLayout, routing, the auth pages and the command palette shell.
- Done when: the app runs with one command, the theme toggle works, every UI component renders in dark and light, and lint passes.

**Step 2: Auth** (`feature/auth`)

- Register, login, Google login, refresh, logout, `me`, protected and admin routes, `seedAdmin` script, 100 starter credits.
- Done when: a user can register, log in, stay logged in after a page reload and log out, and a non-admin user gets 403 on `/admin`.

**Step 3: Backend chat** (`feature/backend-chat`)

- Gemini streaming over SSE, chat and message persistence, creditCheck, atomic deduction, UsageLog.
- Done when: a curl request streams tokens, the `done` event shows correct credits, and a balance of 0 returns 402.

**Step 4: Chat UI** (`feature/chat-ui`)

- Chat list, streaming message view (markdown and code blocks with a copy button), composer (Enter to send, Shift+Enter for a new line), model picker, stop button, live CreditBadge, and a "Recharge" call to action on 402.
- Done when: tokens render smoothly and the credit badge updates without a page reload.

**Step 5: Library** (`feature/library`)

- Link or note input, a suggest step, then a review screen (edit title, summary and tags), then save and embed. List with tag filter, semantic search, delete.
- Done when: searching by meaning (not exact words) finds the right item.

**Step 6: Prompt Vault** (`feature/prompt-vault`)

- CRUD, live variable detection while typing, variable fill modal, then a new chat starts with the filled prompt as its first message. Tags and search.

**Step 7: Document generation** (`feature/doc-gen`)

- Generate a draft, then a split view (section editor next to a live preview), inline edit, reorder, add or remove sections, export to PDF (with proper text wrapping and page breaks in pdf-lib), and a documents list.

**Step 8: Unified search** (`feature/search`) with a `/search` page and results in the command palette.

**Step 9: Wallet and billing** (`feature/wallet-billing`)

- Plans (for example ₹49 = 500 credits, ₹99 = 1200 credits), Razorpay Checkout in test mode, verify endpoint, webhook, idempotent transaction ledger, transaction history table.
- Done when: a test card payment adds credits exactly once, even if both verify and the webhook fire.

**Step 10: Admin dashboard** (`feature/admin-dashboard`)

- Stat cards, a token usage line chart, a Flash vs Pro pie chart, a recent transactions table and an errors table.

**Step 11: Hardening**

- Tests: credit service, variable extraction, webhook signature, auth flow, API integration tests with supertest.
- Final README pass, deploy notes for Vercel and Render (including the cold-start note), and `docs/viva-prep.md`.

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
