# Implementation Spec — Feature 17: App Usage Analytics Dashboard

## Goal
Implement a live Analytics & System Observability Dashboard at `/analytics`:
1. Aggregated KPI Metrics:
   - Total AI Chats recorded & Messages sent
   - Knowledge Library items saved & Pinecone Vector Embeddings count
   - Document Studio generation & export counts
   - Active Prompt Vault templates utilized
   - Free-Tier Safety Index (Render 512MB RAM, MongoDB M0 512MB, Pinecone Starter bounds)
   - Calculated Focus & Productivity Score (0-100)
2. Interactive Activity Trends:
   - Lightweight pure SVG Activity Bar & Line Chart representing daily usage over the past 14/30 days
   - Domain breakdown (Engineering, Research, System Architecture, General)
   - Query Latency & Free-Tier Resilience Gauges
3. Backend Analytics Endpoint:
   - `GET /analytics/stats` aggregating real-time counts from Mongoose collections (`ChatSession`, `LibraryItem`, `Document`, `Prompt`, `Flashcard`, `Reminder`) with offline dev fallback.

## Skills / Docs Read
- `context/build-plan.md` (Feature 17 App Usage Analytics specification)
- `AGENTS.md` (Render 512MB limit, no heavyweight bundle overhead)
- `context/ui-tokens.md` (Design system tokens & chart palette)

## Assumptions
- Lightweight pure React SVG charts without heavy external chart packages to preserve bundle footprint and 60fps responsiveness.
- Backend aggregates actual user records dynamically.

## Exact Files to Modify / Create
- [NEW] `server/src/controllers/analytics.controller.js`
- [NEW] `server/src/routes/analytics.routes.js`
- [MODIFY] `server/src/app.js` (Mount `/analytics`)
- [NEW] `server/test-analytics-e2e.js`
- [NEW] `web-app/src/store/analyticsStore.js`
- [MODIFY] `web-app/src/pages/Analytics/AnalyticsPage.jsx`
- [MODIFY] `web-app/src/pages/Analytics/AnalyticsPage.module.scss`

## Security & Auth Invariants
- `GET /analytics/stats` protected by `authMiddleware`.
- Aggregates scoped strictly to the authenticated `req.user.id`.

## Acceptance Criteria
- `GET /analytics/stats` returns accurate counts and 14-day activity array.
- Analytics page renders KPI cards, focus score meter, SVG trend chart, and free-tier health metrics.
- All automated tests pass: `node test-analytics-e2e.js`.
- Web app builds with zero errors: `npm run build`.
