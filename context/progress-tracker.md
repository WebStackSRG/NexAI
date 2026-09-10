# NexAI — Progress Tracker

> **Agent instruction**: Update this file BEFORE starting a feature unit (mark `[/]`) and AFTER completing it (mark `[x]`). Never skip this update. This file is the single source of truth for project state across all sessions.

---

## Session Metadata

| Field                      | Value                                                       |
| -------------------------- | ----------------------------------------------------------- |
| **Current Phase**          | Phase 2 — Depth                                             |
| **Last Completed Feature** | Feature 11 — Command Palette (`Ctrl/Cmd + K`)               |
| **Next Unit in Queue**     | Feature 12 — File & Document Upload + Multimodal Analysis   |
| **Known Blockers**         | None                                                        |
| **Last Updated**           | 2026-09-11                                                  |

---

## Phase 0 — Core MVP (Base Capstone)

- [x] **Feature 01** — Workspace Scaffolding & Base PWA Shell
  - [x] Monorepo folder structure created
  - [x] `web-app/` Vite + React scaffold
  - [x] `server/` Node + Express scaffold
  - [x] SCSS tokens system (`_tokens.scss`)
  - [x] Workbox PWA + `manifest.json`
  - [x] Page stubs (Chat, Library, Documents, Prompts, Settings)
  - [x] Zustand store stubs
  - [x] Render `render.yaml` + `/health` endpoint
  - [x] Vercel `vercel.json`
  - [x] Basic routing (React Router v6)

- [x] **Feature 02** — Google OAuth + JWT Authentication
  - [x] Google OAuth 2.0 backend flow
  - [x] JWT issuance + `httpOnly` cookie
  - [x] `authMiddleware.js`
  - [x] Frontend auth state (Zustand `authStore`)
  - [x] Protected route wrapper
  - [x] Logout endpoint

- [x] **Feature 03** — Base App Shell & Sidebar
  - [x] Persistent sidebar with mode switcher
  - [x] Mobile drawer behavior
  - [x] Tablet collapsed behavior
  - [x] Active page highlighting
  - [x] User avatar in sidebar footer

- [/] **Feature 04** — Core Streaming Chat
  - [ ] `POST /chat/message` with SSE streaming
  - [ ] Gemini 2.0 Flash integration
  - [ ] Frontend streaming render + cursor animation
  - [ ] Chat list CRUD (create, rename, delete, pin)
  - [ ] Message history load
  - [ ] Auto-title generation
- [x] **Feature 04** — Core Streaming Chat
  - [x] `POST /chat/message` with SSE streaming
  - [x] Gemini 2.0 Flash integration
  - [x] Frontend streaming render + cursor animation
  - [x] Chat list CRUD (create, rename, delete, pin)
  - [x] Message history load
  - [x] Auto-title generation

- [ ] **Feature 05** — Personal Knowledge Library
  - [ ] `POST /library/save` (URL + note)
  - [ ] Content extraction (URL → text)
  - [ ] Gemini Flash: summary + tag suggestion
  - [ ] Pinecone: embed + upsert
  - [ ] Confirm dialog (show suggestions, editable)
  - [ ] Library list view
  - [ ] `PATCH /library/:id/confirm`
  - [ ] `DELETE /library/:id`
- [x] **Feature 05** — Personal Knowledge Library
  - [x] `POST /library/save` (URL + note)
  - [x] Content extraction (URL → text)
  - [x] Gemini Flash: summary + tag suggestion
  - [x] Pinecone: embed + upsert
  - [x] Confirm dialog (show suggestions, editable)
  - [x] Library list view
  - [x] `PATCH /library/:id/confirm`
  - [x] `DELETE /library/:id`

- [ ] **Feature 06** — Chat with RAG
  - [ ] Query embedding on each message
  - [ ] Pinecone top-k search
  - [ ] Context injection into Gemini prompt
  - [ ] LangGraph basic setup (ragTool node)
  - [ ] Sources citation panel in chat
- [x] **Feature 06** — Chat with RAG
  - [x] Query embedding on each message
  - [x] Pinecone top-k search
  - [x] Context injection into Gemini prompt
  - [x] LangGraph basic setup (ragTool node)
  - [x] Sources citation panel in chat

- [ ] **Feature 07** — Basic Settings Page
  - [ ] Profile display (read-only)
  - [ ] `globalInstructions` textarea
  - [ ] Sidebar mode preference
  - [ ] Notification toggles
  - [ ] Theme toggle
  - [ ] `PATCH /users/settings`
- [x] **Feature 07** — Basic Settings Page
  - [x] Profile display (read-only)
  - [x] `globalInstructions` textarea
  - [x] Sidebar mode preference
  - [x] Notification toggles
  - [x] Theme toggle
  - [x] `PATCH /users/settings`

---

## Phase 1 — Key Differentiators

- [x] **Feature 08** — AI Document Generator
  - [x] `/documents` page scaffold
  - [x] Gemini 2.5 Pro structured section generation
  - [x] Tiptap split-pane preview
  - [x] Section CRUD + reorder
  - [x] Image insertion modal (upload / Unsplash / AI)
  - [x] `pdf-lib` PDF export
  - [x] `docx` DOCX export
  - [x] Auto-save + Library indexing

- [x] **Feature 09** — Prompt Vault
  - [x] `/prompts` page with grid/list toggle
  - [x] Create/edit prompt with `{{variable}}` support
  - [x] Variable extraction on save
  - [x] Variable fill form
  - [x] "Use in chat" injection
  - [x] Pin, tag, search
  - [x] `useCount` increment on each use

- [x] **Feature 10** — Unified Global Search
  - [x] `GET /search?q=` endpoint
  - [x] Pinecone semantic search (multi-namespace)
  - [x] MongoDB `$text` search
  - [x] Frontend merged results view

- [x] **Feature 11** — Command Palette (`Ctrl/Cmd + K`)
  - [x] Global shortcut listener
  - [x] Fuzzy search over pages + items
  - [x] Keyboard navigation
  - [x] Recent items default state

---

## Phase 2 — Depth

- [x] **Feature 12** — File & Document Upload + Multimodal Analysis
  - [x] File upload UI (drag-and-drop) for PDF, image, text files
  - [x] Gemini 2.5 Pro: analyze/OCR uploaded file
  - [x] Extracted text chunked + embedded into Pinecone
  - [x] Shows in Library as `type: 'file'`
- [x] **Feature 13** — Developer Utilities (Snippets, JSON, Regex, API Tester)
  - [x] Code Snippet Vault with CRUD, language filters, and search
  - [x] JSON Formatter & Validator with syntax error alerts and copy
  - [x] Regex Sandbox with live group capture inspection and flag toggles
  - [x] REST API Tester with method selection, custom headers, payload, and response viewer
- [x] **Feature 14** — Learning & Study Suite (Flashcards, YouTube Summarizer)
  - [x] SM-2 spaced repetition calculation service (`sm2.service.js`)
  - [x] Flashcards Mongoose model with review indexes and Zod validation
  - [x] Gemini 2.0 Flash structured flashcard deck generator
  - [x] YouTube video & lecture summarizer endpoint (`POST /learning/youtube-summary`)
  - [x] Interactive 3D flip card review UI with SM-2 grading (Again/Hard/Good/Easy)
  - [x] Pomodoro focus session timer (25m/5m/15m)
- [x] **Feature 15** — Productivity / Focus (Reminders, Quiet Hours, Sessions)
  - [x] Reminders Mongoose model with due date and completion indexes
  - [x] Workspace link session bundles Mongoose model (`WorkspaceSession.js`)
  - [x] Zod validation for reminders, sessions, and quiet-hours configuration
  - [x] REST routes mounted at `/focus` (`/focus/reminders`, `/focus/sessions`, `/focus/quiet-hours`)
  - [x] FocusStore Zustand atomic slice with multi-tab launcher and quiet-hours toggle
  - [x] Automated E2E verification test suite (`node test-focus-e2e.js`)
- [ ] **Feature 16** — Onboarding Flow

---

## Phase 3 — Power-User Layer

- [ ] **Feature 17** — App Usage Analytics Dashboard
- [ ] **Feature 18** — Secrets Vault (Web Crypto)
- [ ] **Feature 19** — Creative Writing Suite
- [ ] **Feature 20** — Voice I/O (Web Speech API)

---

## Phase 4 — Extension Bridge (Optional)

- [ ] **Feature 21** — Chrome Extension Scaffold (Manifest V3)
- [ ] **Feature 22** — Extension JWT Authentication Sharing
- [ ] **Feature 23** — Quick-Access Popup
- [ ] **Feature 24** — Page Intelligence ("Ask AI about this page")
- [ ] **Feature 25** — Tab Session Manager

---

## Completion Summary

| Phase               | Total Features | Completed | In Progress |
| ------------------- | -------------- | --------- | ----------- |
| 0 — Core MVP        | 7              | 7         | 0           |
| 1 — Differentiators | 4              | 4         | 0           |
| 2 — Depth           | 5              | 4         | 0           |
| 3 — Power-User      | 4              | 0         | 0           |
| 4 — Extension       | 5              | 0         | 0           |
| **TOTAL**           | **25**         | **15**    | **0**       |
