# NexAI — Progress Tracker

> **Agent instruction**: Update this file BEFORE starting a feature unit (mark `[/]`) and AFTER completing it (mark `[x]`). Never skip this update. This file is the single source of truth for project state across all sessions.

---

## Session Metadata

| Field                      | Value                                 |
| -------------------------- | ------------------------------------- |
| **Current Phase**          | Phase 0 — Core MVP                    |
| **Last Completed Feature** | Feature 05 — Personal Knowledge Library |
| **Next Unit in Queue**     | Feature 06 — Chat with RAG            |
| **Known Blockers**         | None                                  |
| **Last Updated**           | 2026-09-11                            |

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

- [x] **Feature 04** — Core Streaming Chat
  - [x] `POST /chat/message` with SSE streaming
  - [x] Gemini 2.0 Flash integration
  - [x] Frontend streaming render + cursor animation
  - [x] Chat list CRUD (create, rename, delete, pin)
  - [x] Message history load
  - [x] Auto-title generation

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

- [ ] **Feature 07** — Basic Settings Page
  - [ ] Profile display (read-only)
  - [ ] `globalInstructions` textarea
  - [ ] Sidebar mode preference
  - [ ] Notification toggles
  - [ ] Theme toggle
  - [ ] `PATCH /users/settings`

---

## Phase 1 — Key Differentiators

- [ ] **Feature 08** — AI Document Generator
  - [ ] `/documents` page scaffold
  - [ ] Gemini 2.5 Pro structured section generation
  - [ ] Tiptap split-pane preview
  - [ ] Section CRUD + reorder
  - [ ] Image insertion modal (upload / Unsplash / AI)
  - [ ] `pdf-lib` PDF export
  - [ ] `docx` DOCX export
  - [ ] Auto-save + Library indexing

- [ ] **Feature 09** — Prompt Vault
  - [ ] `/prompts` page with grid/list toggle
  - [ ] Create/edit prompt with `{{variable}}` support
  - [ ] Variable extraction on save
  - [ ] Variable fill form
  - [ ] "Use in chat" injection
  - [ ] Pin, tag, search

- [ ] **Feature 10** — Unified Global Search
  - [ ] `GET /search?q=` endpoint
  - [ ] Pinecone semantic search (multi-namespace)
  - [ ] MongoDB `$text` search
  - [ ] Frontend merged results view

- [ ] **Feature 11** — Command Palette (`Ctrl/Cmd + K`)
  - [ ] Global shortcut listener
  - [ ] Fuzzy search over pages + items
  - [ ] Keyboard navigation
  - [ ] Recent items default state

---

## Phase 2 — Depth

- [ ] **Feature 12** — File & Document Upload + Multimodal Analysis
- [ ] **Feature 13** — Developer Utilities (Snippets, JSON, Regex, API Tester)
- [ ] **Feature 14** — Learning & Study Suite (Flashcards, YouTube Summarizer)
- [ ] **Feature 15** — Productivity / Focus (Reminders, Quiet Hours, Sessions)
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
| 0 — Core MVP        | 7              | 5         | 0           |
| 1 — Differentiators | 4              | 0         | 0           |
| 2 — Depth           | 5              | 0         | 0           |
| 3 — Power-User      | 4              | 0         | 0           |
| 4 — Extension       | 5              | 0         | 0           |
| **TOTAL**           | **25**         | **5**     | **0**       |
