# Feature Spec 06 — Chat with RAG

## Goal

Implement Retrieval-Augmented Generation (RAG) in conversational chat (Phase 0 Feature 06):
1. Create LangGraph agent architecture (`server/src/agents/rag.agent.js`) orchestrating retrieval and generation states.
2. On every user query in chat, generate a 768-dim query embedding via `gemini.service.js` and query Pinecone Starter (or in-memory mock fallback) for top-3 relevant knowledge snippets from the user's `library` namespace.
3. Stream retrieved sources telemetry to client via SSE (`data: {"type": "sources", "sources": [...]}\n\n`).
4. Ground Gemini 2.0 Flash prompt with retrieved library items:
   ```
   [Context from User Knowledge Library]:
   - Source 1: "Title" (Relevance: 0.91)
     Snippet: ...
   ```
5. Render a collapsible "Sources" citation panel directly below assistant responses in `web-app` per `context/ui-rules.md` (Section 7), displaying match percentage, title, and excerpt snippet.
6. Persist retrieved source metadata into `Message.toolCalls` for complete agent transparency and diploma viva defensibility.

## Skills / Docs Read

- `AGENTS.md` (LangGraph Node.js lock, Gemini text embeddings, Pinecone Starter, viva defensibility)
- `context/build-plan.md` (Feature 06 requirements)
- `context/ui-rules.md` (Section 7: Sources panel collapsible, top-3 results with titles and scores)
- `context/data-models.md` (Message schema `toolCalls` telemetry)
- `context/code-standards.md` (Section 4.3 Pinecone quota compliance, Section 4.4 Gemini cost management)

## Assumptions

1. LangGraph is used as the orchestration engine (`@langchain/langgraph` StateGraph).
2. Minimum similarity threshold (e.g. cosine score ≥ 0.40) ensures unrelated queries don't inject irrelevant noise into prompt.
3. If no matching sources exist in the user's library, the graph transitions directly to standard generation without delay or errors.
4. Sources metadata is passed to the client during streaming so the citation drawer animates into view alongside early tokens.

## Exact Files to Modify / Create

### Backend (`server/`)
- `server/src/agents/rag.agent.js` [NEW] — LangGraph StateGraph pipeline (retrieveNode + generateNode)
- `server/src/controllers/chat.controller.js` [MODIFY] — Integrate LangGraph RAG pipeline and emit SSE sources event
- `server/test-rag-e2e.js` [NEW] — Automated test validating RAG retrieval, context injection, and SSE sources event

### Frontend (`web-app/`)
- `web-app/src/components/chat/ChatMessage.jsx` [MODIFY] — Add collapsible Sources citation drawer with score badges
- `web-app/src/components/chat/ChatMessage.module.scss` [MODIFY] — Styles for citations panel, toggle, and source cards
- `web-app/src/store/chatStore.js` [MODIFY] — Track streaming sources and store them on the assistant message

### Context Tracking
- `context/progress-tracker.md` [MODIFY] — Mark Feature 06 `[/] In Progress` then `[x] Completed`
- `context/memory.md` [MODIFY] — Log Decision 011 on LangGraph RAG orchestration

## Security & Auth Invariants

1. Vector queries MUST filter by `metadata.userId === req.user._id` to prevent cross-tenant vector leakage.
2. Context injection is bounded to max 3 items and 1,500 words to respect token economics and prevent prompt injection attacks.
3. All RAG endpoints remain protected under existing `authMiddleware`.

## Acceptance Criteria

- [ ] LangGraph StateGraph executes retrieve and generate workflow cleanly.
- [ ] User chat messages automatically search the user's indexed library items in Pinecone.
- [ ] SSE stream emits `type: "sources"` with matched items, scores, and titles.
- [ ] Gemini 2.0 Flash generates response grounded in library context.
- [ ] Frontend displays collapsible "Sources" citation panel below assistant message.
- [ ] Sources are persisted in message record (`toolCalls`).
- [ ] Automated test `node server/test-rag-e2e.js` passes 100%.
- [ ] Client build passes with zero errors (`npm run build`).

## Manual / CLI Verification Test Steps

1. Run `node server/test-rag-e2e.js`.
2. Run `npm run build` in `web-app/`.
3. In browser: add a note to library, open chat, ask a question about that note, verify citation panel appears with high match score.

