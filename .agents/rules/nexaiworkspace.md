---
trigger: always_on
---

NEXAI PROJECT RULES

SOURCE OF TRUTH

1. docs/PRD.md defines WHAT to build (scope, features, data model). docs/BUILD_GUIDE.md defines HOW (structure, tokens, API contracts, build order). Read both before any task.
2. If the PRD and the guide conflict, the PRD wins on scope and the guide wins on structure and code quality. Log any decision you make in docs/decisions.md.
3. Never build anything listed under "Future Scope" in the PRD.

STACK (do not change without approval) 4. Client: React + Vite, SCSS modules, Zustand, React Router, axios. No Tailwind, MUI, Chakra or other UI kits. 5. Server: Node.js + Express, Mongoose (MongoDB Atlas), Gemini API, Pinecone behind vectorDb.service, pdf-lib, Razorpay test mode, JWT + Google OAuth, zod validation. 6. Gemini model names come from env variables only, never hard-coded.

STRUCTURE 7. Monorepo: /client and /server, following the folder structure in docs/BUILD_GUIDE.md exactly. 8. Server flow: route -> validate -> auth -> [requireRole] -> [creditCheck] -> controller -> service/agent. Controllers stay thin; logic lives in services; AI prompts live in agents/prompts. 9. Client: pages compose features/ components, and features/ compose components/ui primitives. Components never call axios directly; they go through store actions and lib/api.

UI CONSISTENCY 10. Use semantic design tokens only (CSS variables from styles/tokens and styles/themes). Never hard-code colors, spacing, font sizes, radii or shadows. 11. Dark theme is the default; every screen must also work in light theme. 12. Reuse components/ui before creating anything new. If a UI pattern appears twice, extract it. 13. Every data view needs loading (Skeleton), empty (EmptyState), error (with retry) and success states. Keep it responsive and accessible.

CORE PRODUCT LOGIC (never break) 14. Every AI call (chat, library suggest, doc generation, title generation) goes through creditCheck and deducts credits from real Gemini token usage: credits = ceil(totalTokens / 100), updated atomically, never below 0, with a UsageLog entry. 15. At 0 credits, return 402 INSUFFICIENT_CREDITS and show a Recharge call to action in the UI. 16. Suggest -> review -> confirm: AI summaries, tags and document sections are never saved without user confirmation. 17. Payments: plans and prices live in server config only. Verify Razorpay signatures, use a raw body for the webhook route only, and credit each paymentId exactly once. 18. All data queries and vector searches are scoped to the logged-in userId.

SECURITY 19. Secrets stay in server .env only. The client never calls Gemini, Pinecone or Razorpay secret APIs. Keep .env.example files updated.

WORKFLOW 20. Follow the build order in docs/BUILD_GUIDE.md one step at a time. Do not start the next step until the current step meets its acceptance criteria. 21. Use one feature branch per step (feature/<name>) with Conventional Commits. 22. After each step, run lint and tests, update docs/api.md and the README if anything changed, then summarize what was done and what I need to set up (env vars, keys, commands).
