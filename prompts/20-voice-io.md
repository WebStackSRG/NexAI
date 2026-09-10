# Implementation Specification: Feature 20 — Voice I/O (Web Speech API)

## Goal
Implement seamless bidirectional Voice I/O in the AI Chat interface using native browser Web Speech API standards:
1. **SpeechRecognition (STT)**: Microphone button in the chat input bar allowing voice-to-text dictation with live listening states, interim transcript display, and auto-insertion into the message draft.
2. **SpeechSynthesis (TTS)**: Audio read-aloud button on assistant response messages with play/stop toggle, clean markdown-to-plain-text sanitization, and automatic utterance cancellation on unmount or manual stop.

## Skills / Docs Read
- `context/build-plan.md` (Feature 20: Voice I/O Web Speech API SpeechRecognition + SpeechSynthesis)
- `context/code-standards.md` (No heavyweight external binary audio libraries; use pure native Web APIs)
- `AGENTS.md` (Free-tier discipline: Zero server-side audio rendering RAM burden)

## Assumptions
- `window.SpeechRecognition || window.webkitSpeechRecognition` is supported in Chromium browsers and WebKit.
- `window.speechSynthesis` is standard in all modern browsers.
- When browser does not support SpeechRecognition, mic button is gracefully disabled or displays an informative tooltip.

## Exact Files to Modify / Create
- [NEW] `prompts/20-voice-io.md`
- [NEW] `web-app/src/lib/speech.js` (SpeechRecognition & SpeechSynthesis abstraction helper)
- [MODIFY] `web-app/src/pages/Chat/ChatPage.jsx` (Mic button, listening state, interim transcript)
- [MODIFY] `web-app/src/pages/Chat/ChatPage.module.scss` (Mic button & active pulsing indicator)
- [MODIFY] `web-app/src/components/chat/ChatMessage.jsx` (Read aloud audio toggle button)
- [MODIFY] `web-app/src/components/chat/ChatMessage.module.scss` (TTS button styling)

## Security & Auth Invariants
1. Audio is processed locally via browser APIs; no audio binary streams are uploaded to Render backend (keeps 512MB RAM free-tier intact).
2. Microphone access is explicitly requested via browser permission prompt on click.

## Acceptance Criteria
1. Chat input bar features a microphone toggle button.
2. Clicking mic activates browser speech recognition; speaking updates the message textarea.
3. Assistant message bubbles feature a "Read aloud" speaker button.
4. Clicking speaker reads the text cleanly (skipping raw code blocks and markdown symbols), and clicking again stops speech.
5. All tests and frontend builds pass cleanly.

## Manual / CLI Verification Test Steps
1. Run `npm run build` in `web-app/`.
2. Inspect Speech helper exports and unit methods.
