# Project Abstract: NexAI

**Project Title:**  
**NexAI: AI-Powered Personal & Developer Workspace with Utility-Metered Billing and Grounded RAG Retrieval**

**Domain:** Full-Stack Web Development, Cloud Computing, Generative AI & Retrieval-Augmented Generation (RAG)  
**Academic Target:** Final Year Diploma Capstone Project (MSBTE K-Scheme)  
**Repository Architecture:** Client-Server Monorepo (`/client` React + Vite | `/server` Node.js + Express)  

---

### 1. Problem Statement
Modern developers, engineering students, and knowledge workers face three acute real-world challenges:
1. **Context & Tool Fragmentation:** Knowledge workers constantly switch between disconnected tools—LLM chat interfaces for ad-hoc queries, note-taking apps for reference material, local files for code snippets, and interview simulators for preparation. This constant context-switching causes cognitive fatigue, duplicated effort, and fragmented data silos.
2. **Prohibitive "Flat-Rate" AI Subscriptions:** Mainstream commercial AI platforms (ChatGPT Plus, Claude Pro) enforce flat $20/month (~₹2,000/mo) subscriptions regardless of usage. A student or light developer executing ten prompts per month pays the exact same rate as an enterprise user, creating an unfair cost barrier with zero usage transparency.
3. **"AI Wrapper" Fragility & Hallucination Persistence:** Typical lightweight AI wrappers pass ungrounded prompts to proprietary LLMs and blindly persist unverified responses into databases, polluting personal knowledge with unvetted hallucinations.

---

### 2. Proposed Solution
**NexAI** resolves these bottlenecks by unifying conversational intelligence, personal knowledge storage, and developer workflows into a cohesive, cost-controlled SaaS platform:
- **Unified Minimalist Workspace:** A Gemini-inspired collapsible single-sidebar navigation with a high-performance, distraction-free conversational canvas supporting real-time Server-Sent Events (SSE) streaming, full Markdown parsing, and syntax-highlighted code execution.
- **Tenant-Isolated Semantic RAG & Library:** A polymorphic personal knowledge vault managing notes, links, documents, source code, and mock interview transcripts. Content is embedded into dense vectors using Gemini Embedding models and stored in vector indexes (Pinecone / local engine) to enable natural-language semantic retrieval grounded in personal data.
- **Prompt Vault & Project Workspaces:** Variable-driven prompt templating (`{{variable}}`) allowing rapid parameter injection into chats, alongside isolated Project Workspaces equipped with custom system instructions and grounded multi-file context injection (up to 2MB).
- **AI Mock Interview & Viva Simulator:** Real-time role-based interview arena featuring dynamic voice ripple visualization, browser speech recognition (STT), voice synthesis (TTS), progressive technical follow-up questions, and automated competency scorecard generation archived to the knowledge vault.
- **Fair-Share Utility Billing & Human-in-the-Loop Safeguards:** Every AI operation executes through a strict credit gateway deducting credits atomically based on actual API token consumption ($\lceil \text{totalTokens} / 100 \rceil$), backed by a Razorpay test-mode payment gateway and a strict *Suggest → Review → Confirm* pattern before persisting AI summaries or documents.

---

### 3. Key Outcomes & Real-World Impact
1. **Single-Pane Productivity:** Consolidates 4 critical workflows (conversational AI, semantic knowledge retrieval, reusable prompt engineering, and viva/interview defense simulation) into a single cohesive interface, cutting cognitive context-switching overhead.
2. **Transparent, Pay-As-You-Burn Economy:** Eliminates the flat ₹2,000/month cost barrier, allowing students and small developers to pay micro-amounts for exact token consumption with automated 402 insufficient-credit prevention.
3. **Data Sovereignty & Grounded Accuracy:** Eliminates silent hallucinations by enforcing human confirmation on all AI modifications and grounding answers in user-owned files via vector embeddings.
4. **Hardened Production Engineering:** Validated with **227 automated tests** (127 server, 100 client) covering unit, integration, and complete end-to-end user journeys, with full role-gated admin observability (tokens, model splits, mock revenue).

---
**Keywords:** Generative AI, Retrieval-Augmented Generation (RAG), Semantic Vector Search, Utility-Metered Billing, Full-Stack Architecture, Human-in-the-Loop, React, Express, MongoDB.
