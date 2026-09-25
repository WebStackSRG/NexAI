# NexAI

> AI-Powered Personal & Developer Workspace with Utility-Metered Billing.

NexAI is a personal knowledge and developer productivity workspace designed with real, token-based credit metering, personal library management with semantic RAG retrieval, structured document drafting, variable-driven prompt templating, and an administrative usage dashboard.

## Tech Stack

- **Client:** React, Vite, SCSS Modules, Zustand, React Router, Lucide Icons, Axios.
- **Server:** Node.js, Express, Mongoose (MongoDB), Zod, Pino logging, Helmet, CORS.
- **AI / Retrieval:** Google Gemini API, Pinecone Vector Database.
- **Billing:** Razorpay (Test Mode).

## Prerequisites

- Node.js >= 20.0.0 (check with `node -v` or use `nvm use`)
- npm >= 10.0.0
- MongoDB instance (local or MongoDB Atlas connection string)

## Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure environment:**
   - Copy `server/.env.example` to `server/.env` and configure `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `GEMINI_API_KEY`.
   - Copy `client/.env.example` to `client/.env`.

3. **Run development servers:**

   ```bash
   npm run dev
   ```
   - Client: http://localhost:5173
   - Server: http://localhost:5000 (Health check: http://localhost:5000/api/health)

4. **Lint and format:**

   ```bash
   npm run lint
   npm run format
   ```

5. **Run test suite:**
   ```bash
   npm run test
   ```

## Development Progress

- [x] **Step 1: Scaffold & Design System** (`feature/scaffold`)
- [x] **Step 2: Authentication & Persistence** (`feature/auth`)
- [x] **Step 3: Backend Chat with SSE & Metering** (`feature/backend-chat`)
- [x] **Step 4: Chat UI & Real-Time Streaming** (`feature/chat-ui`)
  - Full-height responsive Chat workspace with collapsible conversation sidebar
  - Streaming fetch + ReadableStream SSE consumption with token/done/error parsing
  - Markdown rendering with Prism syntax highlighting and one-click code copying
  - Live CreditBadge updates in Topbar & Sidebar on stream completion
  - 402 Insufficient Credits handling with "Recharge to continue" banner and input locking
  - Generation abort (Stop button), typing indicator, smart auto-scrolling, and model picker (Flash/Pro)
- [ ] **Step 5: Library & Semantic RAG** (`feature/library`)
- [ ] **Step 6: Prompt Vault** (`feature/prompt-vault`)
- [ ] **Step 7: Document Generation** (`feature/doc-gen`)
- [ ] **Step 8: Unified Search** (`feature/search`)
- [ ] **Step 9: Wallet & Billing** (`feature/wallet-billing`)
- [ ] **Step 10: Admin Dashboard** (`feature/admin-dashboard`)
- [ ] **Step 11: Hardening & Deployment**
