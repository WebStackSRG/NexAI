# Implementation Specification: Phase 4 — Companion Extension Bridge (Features 21–25)

## Goal
Implement the complete Chrome Extension Companion Bridge for NexAI based on Manifest V3 best practices:
1. **Feature 21 (Extension Scaffold)**: Manifest V3 with `commands` for global hotkey (`Ctrl+Shift+Y` / `Command+Shift+Y`), background service worker, host permissions, and responsive popup.
2. **Feature 22 (JWT Sharing & Auth Bridge)**: Seamless token synchronization via `chrome.storage.local` and `window.postMessage` / cookies from the NexAI web app to the companion extension.
3. **Feature 23 (Quick-Access Popup)**: Floating mini chat UI allowing instantaneous queries directly to the NexAI backend `/chat/message` endpoint without leaving the active tab.
4. **Feature 24 (Page Intelligence)**: Content script and Context Menu ("Ask NexAI about this page / selection") capturing page context and selected text for instant AI analysis.
5. **Feature 25 (Tab Session Manager)**: One-click session snapshot capturing all open tabs in current window and saving them to the NexAI workspace sessions API (`POST /focus/sessions`).

## Skills / Docs Read
- `chrome-extensions` skill instructions (Manifest V3 rules: script-generated icons or omit icons, async service workers, sandboxed CSP, declarative commands)
- `context/build-plan.md` (Phase 4 specs: Features 21-25)
- `AGENTS.md` (Tech stack lock: Custom Google OAuth + JWT sharing between Web App & Extension)

## Assumptions
- Extension code lives in `extension-companion/`.
- Icons are generated programmatically (PNG or SVG) or provided in standard sizes (16, 48, 128).
- Extension connects to `http://localhost:5000` in dev, configurable for production.

## Exact Files to Modify / Create
- [NEW] `prompts/21-25-extension-companion.md`
- [NEW] `extension-companion/manifest.json`
- [NEW] `extension-companion/src/background/service-worker.js` (Global hotkey listener, context menus, tab capture, badge status)
- [NEW] `extension-companion/src/content-scripts/page-intelligence.js` (Context extraction, selection listener)
- [NEW] `extension-companion/src/popup/popup.html`
- [NEW] `extension-companion/src/popup/popup.css`
- [NEW] `extension-companion/src/popup/popup.js` (Quick chat, tab saver, auth sync, open web app)
- [NEW] `extension-companion/icons/` (16, 48, 128 px PNG icons generated via Canvas/Node)
- [MODIFY] `web-app/src/store/authStore.js` (Broadcast JWT to extension storage when available)

## Security & Auth Invariants
1. Extension stores JWT securely in `chrome.storage.local` (never in `window.localStorage` of extension context).
2. All background requests send `Authorization: Bearer <jwt>`.
3. Safe CSP: No `eval()`, inline scripts in HTML files, or remote scripts.

## Acceptance Criteria
1. `manifest.json` is valid Manifest V3 with permissions: `storage`, `activeTab`, `tabs`, `contextMenus`, `commands`.
2. Global shortcut `Ctrl+Shift+Y` opens quick-access action or popup.
3. Right-click context menu "Ask NexAI about this" extracts selected text and passes to popup.
4. "Save Open Tabs as Workspace Session" captures tab URLs and posts to `/focus/sessions`.
5. Quick chat streams or fetches response from backend.

## Manual / CLI Verification Test Steps
1. Run Node script to validate extension manifest and file integrity.
2. Verify all icons exist and match declared dimensions.
