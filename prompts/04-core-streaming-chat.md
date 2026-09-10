# Feature Spec 04 — Core Streaming Chat

## Goal

Implement the complete real-time streaming chat feature as defined in Phase 0 Feature 04:

1. Mongoose schemas for `Chat` and `Message`.
2. Gemini 2.0 Flash service using `@google/genai` with streaming generator and title summarization, plus simulated fallback when `GEMINI_API_KEY` is not present for resilient offline testing.
3. Server-Sent Events (SSE) route `POST /chat/message` streaming chunked tokens directly to the client.
4. Chat session CRUD routes (`GET /chat`, `POST /chat`, `GET /chat/:id`, `PATCH /chat/:id`, `DELETE /chat/:id`).
5. Asynchronous auto-title generation for new chats after the first message exchange.
6. Zustand `chatStore` with reactive SSE reader, error handling, cancellation, and message list synchronization.
7. Responsive Chat interface adhering to `context/ui-rules.md` (Section 7) with dual-pane layout, markdown formatting, syntax code blocks with copy-to-clipboard, pulsing cursor indicator during generation, prompt starters, and session management.

## Skills / Docs Read

- `AGENTS.md` (Role & Identity, Tech Stack Lock, Two-Step Protocol, Full-Access Autonomous Mode)
- `context/build-plan.md` (Phase 0 Feature 04 requirements)
- `context/data-models.md` (Chat schema, Message schema, indexes)
- `context/ui-rules.md` (Section 7: Chat Interface, layout, streaming rules, empty states)
- `context/ui-tokens.md` (Tokens, typography, animations, borders)
- `context/code-standards.md` (Section 2.4 Streaming Responses, Section 3 Controller-Service-Repository, Section 4.4 Gemini Cost Management - 20 msg history cap)
- `gemini-api-dev` skill (`@google/genai` usage, `gemini-2.0-flash`, `models.generateContentStream`)
- `modern-web-guidance` (Streaming UI updates, scroll-to-bottom ergonomics, copy-to-clipboard)

## Assumptions

1. The streaming protocol uses standard Server-Sent Events (`text/event-stream`) returning JSON events formatted as `data: {"chunk": "..."}\n\n` followed by a completion event `data: {"done": true, "message": {...}, "chat": {...}}\n\n`.
2. Model is locked to `gemini-2.0-flash`.
3. System prompt incorporates `user.globalInstructions` if configured on the user profile.
4. To respect free-tier resource constraints, only the last 20 messages of history are forwarded to Gemini for context.
5. In development when MongoDB is offline, `chat.service.js` leverages an in-memory dev store (same robust disconnect-tolerant design as `auth.service.js`).
6. When `GEMINI_API_KEY` is not configured, the service provides a streaming markdown fallback explaining the missing API key or responding informatively, preventing crashes during local offline evaluation.

## Exact Files to Modify / Create

### Backend (`server/`)

- `server/src/models/Chat.js` [NEW] — Mongoose model for chat sessions
- `server/src/models/Message.js` [NEW] — Mongoose model for chat messages
- `server/src/services/gemini.service.js` [NEW] — `@google/genai` integration with streaming and auto-title generation
- `server/src/services/chat.service.js` [NEW] — Chat session management and message persistence
- `server/src/schemas/chat.schema.js` [NEW] — Zod validation schemas for chat operations
- `server/src/controllers/chat.controller.js` [NEW] — HTTP and SSE streaming controllers
- `server/src/routes/chat.routes.js` [NEW] — Express router with auth middleware
- `server/src/app.js` [MODIFY] — Mount `/chat` routes
- `server/test-chat-e2e.js` [NEW] — Automated integration test for chat CRUD and SSE streaming

### Frontend (`web-app/`)

- `web-app/src/store/chatStore.js` [NEW] — Zustand store managing chats, messages, and streaming reader
- `web-app/src/components/chat/ChatMessage.jsx` [NEW] — Markdown message renderer with code blocks and copy button
- `web-app/src/components/chat/ChatMessage.module.scss` [NEW] — BEM styling for user and assistant bubbles
- `web-app/src/pages/Chat/ChatPage.jsx` [MODIFY] — Dual-panel chat interface with session drawer, starter chips, and streaming UI
- `web-app/src/pages/Chat/ChatPage.module.scss` [MODIFY] — SCSS module with full dark-theme tokens and responsive breakpoints

### Context Tracking

- `context/progress-tracker.md` [MODIFY] — Mark Feature 04 `[/] In Progress` then `[x] Completed`
- `context/memory.md` [MODIFY] — Record architectural decisions and verification results

## Security & Auth Invariants

1. All `/chat` routes require authentication via `authMiddleware`.
2. A user can only view, update, delete, or send messages to chats where `chat.userId === req.user._id`.
3. Input prompt length is validated via Zod (`max(20000)` characters) to prevent memory exhaustion.
4. Gemini API keys are never exposed to the client; all AI calls are executed server-side.

## Acceptance Criteria

- [ ] `POST /chat/message` streams response using SSE with `gemini-2.0-flash`.
- [ ] User messages and completed assistant messages are persisted with proper timestamps and role tags.
- [ ] Chat session list allows creating a new chat, renaming a chat, pinning/unpinning, and deleting with confirmation.
- [ ] Active chat loads its historical messages in chronological order.
- [ ] First message in a "New Chat" automatically triggers concise title generation.
- [ ] Frontend displays animated blinking cursor during streaming (`▌`).
- [ ] Code snippets render with language badge and working "Copy" button.
- [ ] Input textarea auto-resizes and supports `Enter` (send) and `Shift+Enter` (new line).
- [ ] Stop streaming button terminates generation cleanly.
- [ ] Automated e2e test passes (`node server/test-chat-e2e.js`).
- [ ] Client build passes with zero errors (`npm run build`).

## Manual / CLI Verification Test Steps

1. Run `node server/test-chat-e2e.js` to verify auth checks, chat creation, SSE streaming, renaming, and deletion.
2. Run `npm run build` in `web-app/` to verify React components and SCSS compilation.
3. Test streaming in browser: verify message stream chunks, auto-scroll, copy code block, and title update.
