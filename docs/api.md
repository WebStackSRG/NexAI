# NexAI API Documentation

All routes are prefixed with `/api` and require authentication unless explicitly marked as public.

## Standard Response Formats

### Success Response

```json
{
  "data": { ... },
  "meta": { ... } // optional
}
```

### Error Response

```json
{
  "error": {
    "code": "STRING_CODE",
    "message": "Human-readable description",
    "details": null // optional extra data or validation errors
  }
}
```

---

## Health & System

### GET `/api/health`

Check backend server status and database connectivity.

- **Auth:** Public
- **Method:** `GET`
- **Response `200 OK` (when database is connected)**:

```json
{
  "data": {
    "status": "ok",
    "db": "connected",
    "uptime": 12.34
  }
}
```

- **Response `503 Service Unavailable` (when database is disconnected)**:

```json
{
  "data": {
    "status": "degraded",
    "db": "disconnected",
    "uptime": 12.34
  }
}
```

---

## Authentication & Authorization

### POST `/api/auth/register`

Register a new user account with email and password. Assigns 100 starter credits.

- **Auth:** Public (Rate-limited: 30 requests/15 min)
- **Method:** `POST`
- **Request Body:**

```json
{
  "email": "user@example.com",
  "password": "StrongPassword123!"
}
```

- **Response `201 Created`**:

```json
{
  "data": {
    "user": {
      "_id": "673f1234...",
      "email": "user@example.com",
      "role": "user",
      "wallet": {
        "creditsRemaining": 100,
        "tier": "free",
        "totalTokensConsumed": 0
      },
      "settings": {
        "theme": "dark",
        "defaultModel": "flash",
        "webSearchDefaultOn": false
      },
      "createdAt": "2026-09-25T12:00:00.000Z",
      "updatedAt": "2026-09-25T12:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1Ni..."
  }
}
```

_Note: Sets `refreshToken` in an httpOnly cookie (7-day duration)._

### POST `/api/auth/login`

Authenticate an existing user with email and password.

- **Auth:** Public (Rate-limited: 30 requests/15 min)
- **Method:** `POST`
- **Request Body:**

```json
{
  "email": "user@example.com",
  "password": "StrongPassword123!"
}
```

- **Response `200 OK`**:

```json
{
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGciOiJIUzI1Ni..."
  }
}
```

_Note: Sets `refreshToken` in an httpOnly cookie._

### POST `/api/auth/google`

Authenticate or register a user via Google OAuth ID token.

- **Auth:** Public (Rate-limited: 30 requests/15 min)
- **Method:** `POST`
- **Request Body:**

```json
{
  "credential": "google_id_token_jwt..."
}
```

- **Response `200 OK`**:

```json
{
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGciOiJIUzI1Ni..."
  }
}
```

### POST `/api/auth/refresh`

Generate a new short-lived access token using the httpOnly refresh cookie.

- **Auth:** Public (uses `refreshToken` cookie)
- **Method:** `POST`
- **Response `200 OK`**:

```json
{
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGciOiJIUzI1Ni..."
  }
}
```

### POST `/api/auth/logout`

Log out and clear the httpOnly refresh cookie.

- **Auth:** Public
- **Method:** `POST`
- **Response `200 OK`**:

```json
{
  "data": {
    "message": "Logged out successfully"
  }
}
```

### GET `/api/auth/me`

Retrieve the authenticated user's profile and credit status.

- **Auth:** Bearer Token
- **Method:** `GET`
- **Header:** `Authorization: Bearer <accessToken>`
- **Response `200 OK`**:

```json
{
  "data": {
    "user": { ... }
  }
}
```

---

## User Settings

### PATCH `/api/users/me/settings`

Update appearance and default preferences for the authenticated user.

- **Auth:** Bearer Token
- **Method:** `PATCH`
- **Request Body:**

```json
{
  "theme": "light", // "dark" | "light"
  "defaultModel": "pro", // "flash" | "pro"
  "webSearchDefaultOn": true
}
```

- **Response `200 OK`**:

```json
{
  "data": {
    "user": { ... }
  }
}
```

---

## Admin

### GET `/api/admin/stats`

Telemetry and metrics endpoint restricted to admin users.

- **Auth:** Bearer Token + Role `admin`
- **Method:** `GET`
- **Response `200 OK`**:

```json
{
  "data": {
    "message": "Admin authorization verified"
  }
}
```

- **Response `403 Forbidden` (for non-admin users)**:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions to access this resource",
    "details": null
  }
}
```

---

## Chat & Messaging (Step 3 & Step 6)

### GET `/api/chats`

Retrieve chat sessions belonging to the authenticated user, ordered by most recently updated. Supports filtering by project.

- **Auth:** Bearer Token
- **Method:** `GET`
- **Query Params:**
  - `projectId` *(optional, string)*: Filter chats belonging to a specific Project Workspace.
- **Response `200 OK`**:

```json
{
  "data": [
    {
      "_id": "673f5678...",
      "userId": "673f1234...",
      "projectId": "67401122...", // or null
      "title": "React Architecture Discussion",
      "pinned": false,
      "createdAt": "2026-09-25T12:30:00.000Z",
      "updatedAt": "2026-09-25T12:35:00.000Z"
    }
  ]
}
```

### POST `/api/chats`

Create a new chat conversation, optionally associated with a Project Workspace.

- **Auth:** Bearer Token
- **Method:** `POST`
- **Request Body:**

```json
{
  "title": "My New Chat", // optional, defaults to "New Chat"
  "projectId": "67401122..." // optional project ObjectId
}
```

- **Response `201 Created`**:

```json
{
  "data": {
    "_id": "673f5678...",
    "userId": "673f1234...",
    "projectId": "67401122...",
    "title": "My New Chat",
    "pinned": false,
    "createdAt": "2026-09-25T12:30:00.000Z",
    "updatedAt": "2026-09-25T12:30:00.000Z"
  }
}
```

### PATCH `/api/chats/:id`

Update an existing chat session (title, project association, or pin status).

- **Auth:** Bearer Token
- **Method:** `PATCH`
- **Request Body:**

```json
{
  "title": "Updated Chat Title", // optional
  "projectId": "67401122...", // optional (pass null to detach from project)
  "pinned": true // optional
}
```

- **Response `200 OK`**:

```json
{
  "data": {
    "_id": "673f5678...",
    "userId": "673f1234...",
    "projectId": "67401122...",
    "title": "Updated Chat Title",
    "pinned": true,
    "updatedAt": "2026-09-25T12:40:00.000Z"
  }
}
```

- **Response `200 OK`**:

```json
{
  "data": {
    "_id": "673f5678...",
    "userId": "673f1234...",
    "title": "Updated Chat Title",
    "updatedAt": "2026-09-25T12:36:00.000Z"
  }
}
```

### DELETE `/api/chats/:id`

Delete a chat session and all messages associated with it.

- **Auth:** Bearer Token
- **Method:** `DELETE`
- **Response `200 OK`**:

```json
{
  "data": {
    "message": "Chat deleted successfully"
  }
}
```

### GET `/api/chats/:id/messages`

Retrieve message history for a specific chat owned by the authenticated user in chronological order.

- **Auth:** Bearer Token
- **Method:** `GET`
- **Response `200 OK`**:

```json
{
  "data": [
    {
      "_id": "673f9012...",
      "chatId": "673f5678...",
      "role": "user",
      "content": "What is the difference between state and props?",
      "tokensUsed": 0,
      "createdAt": "2026-09-25T12:31:00.000Z"
    },
    {
      "_id": "673f9013...",
      "chatId": "673f5678...",
      "role": "assistant",
      "content": "In React, **props** are inputs passed down...",
      "tokensUsed": 184,
      "createdAt": "2026-09-25T12:31:02.000Z"
    }
  ]
}
```

### POST `/api/chats/:id/messages` (SSE Streaming)

Send a prompt message into a chat and receive the AI response streamed in real time via Server-Sent Events (SSE).

- **Auth:** Bearer Token (Credit Check required: `creditsRemaining > 0`)
- **Rate-limit:** 30 requests / minute per IP
- **Method:** `POST`
- **Request Body:**

```json
{
  "content": "Explain vector embeddings concisely.",
  "model": "flash" // optional: "flash" | "pro" (defaults to user settings or flash)
}
```

- **Response Stream (`200 OK`, `Content-Type: text/event-stream`):**
  - **`event: token`**
    ```json
    data: {"text":"Vector "}
    data: {"text":"embeddings "}
    data: {"text":"are numerical arrays..."}
    ```
  - **`event: done`**
    ```json
    data: {"messageId":"673f9013...","tokensUsed":120,"creditsDeducted":2,"creditsRemaining":98,"chatTitle":"Vector Embeddings Explained"}
    ```
  - **`event: error`** (emitted if stream fails prematurely)
    ```json
    data: {"code":"GEMINI_API_ERROR","message":"Stream failed to complete"}
    ```

- **Insufficient Credits (`402 Payment Required`):**
  If `wallet.creditsRemaining <= 0` prior to initiating the call:

```json
{
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "Recharge to continue",
    "details": null
  }
}
```

### Frontend Streaming Client (`lib/sse.js`)

Because standard `EventSource` cannot send `POST` request bodies or `Authorization: Bearer <token>` headers, the frontend consumes this endpoint using `fetch` with `ReadableStream` (`client/src/lib/sse.js`).

- **Stream Parser:** `parseSseStream(readableStream, { onToken, onDone, onError })` safely decodes UTF-8 Uint8Array chunks, buffers network fragment boundaries, and dispatches SSE events.
- **Client Method:** `streamChatMessage({ chatId, content, model, signal, onToken, onDone, onError })` connects to `/api/chats/:id/messages`, handles 402 HTTP status with `insufficientCredits` activation, and executes the parser.
- **Credit Sync:** On receiving the `done` event, `chatStore` atomically dispatches `useAuthStore.getState().updateCredits(creditsRemaining)`, updating the Topbar and Sidebar `CreditBadge` without a page refresh.

---

## Personal Library (Step 5: Library & Semantic Search)

### POST `/api/library/suggest`

Analyzes article content or user notes and generates an AI-suggested title, summary, and tags with Gemini. Does **NOT** save the item to the database (Suggest &rarr; Review &rarr; Confirm pattern).

- **Auth:** Bearer Token (Credit Check required: `creditsRemaining > 0`)
- **Rate-limit:** 30 requests / minute per IP
- **Method:** `POST`
- **Request Body (for link):**

```json
{
  "type": "link",
  "url": "https://example.com/guide-to-react"
}
```

- **Request Body (for note):**

```json
{
  "type": "note",
  "content": "Docker multi-stage builds help create smaller container images by separating build dependencies from runtime..."
}
```

- **Response `200 OK`**:

```json
{
  "data": {
    "type": "link",
    "url": "https://example.com/guide-to-react",
    "title": "A Modern Guide to React Architecture",
    "summary": "Explores component composition, custom hooks, and server-side rendering patterns in modern web applications.",
    "tags": ["react", "architecture", "frontend", "javascript"],
    "content": "Extracted text content...",
    "tokensUsed": 160,
    "creditsDeducted": 2,
    "creditsRemaining": 98
  }
}
```

- **Response `402 Payment Required` (when credit balance is 0):**

```json
{
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "Recharge to continue",
    "details": null
  }
}
```

---

### POST `/api/library/documents/generate`

Generates an AI-drafted structured document (resume, technical spec, analysis report, study notes) using Gemini Flash JSON mode. Returns a draft with structured sections (`title`, `category`, `summary`, `sections: [{ heading, body }]`) without auto-saving to the database (Suggest &rarr; Review &rarr; Confirm pattern).

- **Auth:** Bearer Token (Credit Check required: `creditsRemaining > 0`)
- **Rate-limit:** 30 requests / minute per IP
- **Method:** `POST`
- **Request Body:**

```json
{
  "prompt": "Write a senior full-stack engineer resume with React, Node.js, and cloud systems",
  "category": "resume"
}
```

- **Response `200 OK`**:

```json
{
  "data": {
    "title": "Senior Full-Stack Software Engineer Resume",
    "category": "resume",
    "summary": "Experienced engineer with 5+ years building scalable distributed web applications.",
    "sections": [
      { "heading": "Professional Summary", "body": "Proven track record in high-concurrency systems..." },
      { "heading": "Technical Skills", "body": "- **Frontend:** React 18, Vite, TypeScript\n- **Backend:** Node.js, Express, MongoDB" },
      { "heading": "Work Experience", "body": "**Senior Engineer** @ Acme Corp (2022-Present)..." }
    ],
    "tokensUsed": 350,
    "creditsDeducted": 4,
    "creditsRemaining": 96
  }
}
```

- **Response `402 Payment Required` (when credit balance is 0):**

```json
{
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "Recharge to continue",
    "details": null
  }
}
```

---

### GET `/api/library/documents/:id/export.pdf`

Generates and streams a styled, multi-page PDF document server-side using `pdf-lib` with automatic text wrapping, pagination, headers/footers, and page numbers.

- **Auth:** Bearer Token
- **Method:** `GET`
- **Response `200 OK`**:
  - `Content-Type: application/pdf`
  - `Content-Disposition: attachment; filename="document_title.pdf"`
  - Binary stream of styled PDF bytes.


### POST `/api/library`

Saves a confirmed library item into MongoDB and generates dense vector embeddings stored in the vector database for semantic search.

- **Auth:** Bearer Token
- **Method:** `POST`
- **Request Body:**

```json
{
  "type": "link",
  "url": "https://example.com/guide-to-react",
  "title": "A Modern Guide to React Architecture",
  "summary": "Explores component composition and state management.",
  "tags": ["react", "architecture", "frontend"],
  "content": "Article body text..."
}
```

- **Response `201 Created`**:

```json
{
  "data": {
    "_id": "673fa001...",
    "userId": "673f1234...",
    "type": "link",
    "url": "https://example.com/guide-to-react",
    "title": "A Modern Guide to React Architecture",
    "summary": "Explores component composition and state management.",
    "tags": ["react", "architecture", "frontend"],
    "content": "Article body text...",
    "vectorId": "673fa001...",
    "createdAt": "2026-09-25T13:00:00.000Z",
    "updatedAt": "2026-09-25T13:00:00.000Z"
  }
}
```

---

### GET `/api/library`

Retrieves paginated library items owned by the authenticated user, optionally filtered by tag. Includes all unique user tags in metadata.

- **Auth:** Bearer Token
- **Method:** `GET`
- **Query Parameters:**
  - `tag` (optional string): Filter items matching this tag
  - `page` (optional integer, default `1`)
  - `limit` (optional integer, default `20`, max `100`)

- **Response `200 OK`**:

```json
{
  "data": [
    {
      "_id": "673fa001...",
      "userId": "673f1234...",
      "type": "link",
      "url": "https://example.com/guide-to-react",
      "title": "A Modern Guide to React Architecture",
      "summary": "Explores component composition and state management.",
      "tags": ["react", "architecture", "frontend"],
      "createdAt": "2026-09-25T13:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "tags": ["architecture", "frontend", "react"]
  }
}
```

---

### GET `/api/library/search`

Executes semantic search over the authenticated user's library items by conceptual meaning using vector embeddings with MongoDB text-ranking fallback.

- **Auth:** Bearer Token
- **Method:** `GET`
- **Query Parameters:**
  - `q` (required string): Natural language query or concept

- **Response `200 OK`**:

```json
{
  "data": [
    {
      "_id": "673fa001...",
      "title": "A Modern Guide to React Architecture",
      "summary": "Explores component composition and state management.",
      "tags": ["react", "architecture", "frontend"],
      "type": "link",
      "url": "https://example.com/guide-to-react",
      "createdAt": "2026-09-25T13:00:00.000Z"
    }
  ]
}
```

---

### GET `/api/library/:id`

Retrieves a single library item by ID owned by the authenticated user.

- **Auth:** Bearer Token
- **Method:** `GET`
- **Response `200 OK`**:

```json
{
  "data": {
    "_id": "673fa001...",
    "userId": "673f1234...",
    "type": "link",
    "title": "A Modern Guide to React Architecture",
    "summary": "Explores component composition...",
    "tags": ["react", "architecture"],
    "createdAt": "2026-09-25T13:00:00.000Z"
  }
}
```

---

### PATCH `/api/library/:id`

Updates title, summary, tags, or content for an existing library item. Automatically regenerates and updates the vector embedding if text attributes changed.

- **Auth:** Bearer Token
- **Method:** `PATCH`
- **Request Body:**

```json
{
  "title": "Updated Title",
  "summary": "Updated summary text",
  "tags": ["react", "frontend", "web-dev"]
}
```

- **Response `200 OK`**:

```json
{
  "data": {
    "_id": "673fa001...",
    "title": "Updated Title",
    "summary": "Updated summary text",
    "tags": ["react", "frontend", "web-dev"],
    "updatedAt": "2026-09-25T13:05:00.000Z"
  }
}
```

---

### DELETE `/api/library/:id`

Deletes a library item from MongoDB and purges its vector embedding from the vector index.

- **Auth:** Bearer Token
- **Method:** `DELETE`
- **Response `200 OK`**:

```json
{
  "data": {
    "message": "Library item deleted successfully"
  }
}
```

---

## Project Workspaces (Step 6 / Projects)

### GET `/api/projects`

Retrieve all project workspaces created by the authenticated user, complete with real-time associated chat counts.

- **Auth:** Bearer Token
- **Method:** `GET`
- **Response `200 OK`**:

```json
{
  "data": [
    {
      "_id": "67401122...",
      "userId": "673f1234...",
      "name": "AI Viva Preparation",
      "description": "Viva prep for diploma capstone project",
      "color": "#8b5cf6",
      "customInstructions": "Act as an experienced MSBTE Viva Examiner...",
      "sources": [
        {
          "_id": "67402233...",
          "name": "PRD.md",
          "size": 27411,
          "mimeType": "text/markdown",
          "createdAt": "2026-09-26T10:00:00.000Z"
        }
      ],
      "chatCount": 3,
      "createdAt": "2026-09-26T09:00:00.000Z",
      "updatedAt": "2026-09-26T10:00:00.000Z"
    }
  ]
}
```

### POST `/api/projects`

Create a new project workspace.

- **Auth:** Bearer Token
- **Method:** `POST`
- **Request Body:**

```json
{
  "name": "Full-Stack System Architecture",
  "description": "Design docs and RFC discussions",
  "color": "#10b981",
  "customInstructions": "Always reply with architectural diagrams and clean modular code."
}
```

- **Response `201 Created`**:

```json
{
  "data": {
    "_id": "67403344...",
    "userId": "673f1234...",
    "name": "Full-Stack System Architecture",
    "description": "Design docs and RFC discussions",
    "color": "#10b981",
    "customInstructions": "Always reply with architectural diagrams and clean modular code.",
    "sources": [],
    "createdAt": "2026-09-26T12:00:00.000Z",
    "updatedAt": "2026-09-26T12:00:00.000Z"
  }
}
```

### GET `/api/projects/:id`

Retrieve details of a single project workspace, including its sources and associated chat sessions.

- **Auth:** Bearer Token
- **Method:** `GET`
- **Response `200 OK`**:

```json
{
  "data": {
    "_id": "67403344...",
    "userId": "673f1234...",
    "name": "Full-Stack System Architecture",
    "description": "Design docs and RFC discussions",
    "color": "#10b981",
    "customInstructions": "...",
    "sources": [],
    "chats": [
      {
        "_id": "67404455...",
        "title": "Database Schema Discussion",
        "pinned": true,
        "updatedAt": "2026-09-26T12:15:00.000Z"
      }
    ]
  }
}
```

### PATCH `/api/projects/:id`

Update project name, description, color, or custom instructions.

- **Auth:** Bearer Token
- **Method:** `PATCH`
- **Request Body:**

```json
{
  "name": "Updated Project Name",
  "customInstructions": "New persona instructions..."
}
```

- **Response `200 OK`**:

```json
{
  "data": {
    "_id": "67403344...",
    "name": "Updated Project Name",
    "customInstructions": "New persona instructions...",
    "updatedAt": "2026-09-26T12:30:00.000Z"
  }
}
```

### DELETE `/api/projects/:id`

Delete a project workspace. Automatically unlinks (detaches) all associated chats (`projectId: null`) without deleting conversation history.

- **Auth:** Bearer Token
- **Method:** `DELETE`
- **Response `200 OK`**:

```json
{
  "data": {
    "message": "Project deleted and associated chats unlinked"
  }
}
```

### POST `/api/projects/:id/sources`

Add a local file source (Markdown, code, text, PDF, JSON) to the project knowledge base. Injects into chat context for all conversations in this project.

- **Auth:** Bearer Token
- **Method:** `POST`
- **Request Body:**

```json
{
  "name": "schema.prisma",
  "content": "datasource db { provider = \"postgresql\" ... }",
  "size": 1420,
  "mimeType": "text/plain"
}
```

- **Response `201 Created`**:

```json
{
  "data": {
    "_id": "67405566...",
    "name": "schema.prisma",
    "size": 1420,
    "mimeType": "text/plain",
    "createdAt": "2026-09-26T12:45:00.000Z"
  }
}
```

### DELETE `/api/projects/:id/sources/:sourceId`

Remove a source file from the project workspace.

- **Auth:** Bearer Token
- **Method:** `DELETE`
- **Response `200 OK`**:

```json
{
  "data": {
    "message": "Source deleted from project"
  }
}
```

---

## Prompt Vault (Step 7 / Prompts)

Reusable prompt templates with variable extraction and dynamic in-chat parameter substitution.

### GET `/api/prompts`

Retrieve all prompt templates created by the authenticated user, sorted by favorites first.

- **Auth:** Bearer Token
- **Method:** `GET`
- **Query Parameters:**
  - `tag` (optional): Filter prompts containing a specific tag.
  - `search` (optional): Case-insensitive search on title, description, template, and tags.
  - `isFavorite` (optional, `'true' | 'false'`): Filter favorites.
- **Response `200 OK`**:

```json
{
  "data": [
    {
      "_id": "67406677...",
      "userId": "673f1122...",
      "title": "Code Reviewer",
      "description": "Reviews code against standard engineering guidelines",
      "template": "Analyze the following {{language}} code:\n\n{{code}}\n\nFocus on: {{focus_areas}}",
      "variables": ["language", "code", "focus_areas"],
      "tags": ["engineering", "review"],
      "isFavorite": true,
      "createdAt": "2026-09-26T14:30:00.000Z",
      "updatedAt": "2026-09-26T14:30:00.000Z"
    }
  ]
}
```

### POST `/api/prompts`

Create a new prompt template. Variables with `{{variable_name}}` syntax are automatically extracted, trimmed, and deduplicated.

- **Auth:** Bearer Token
- **Method:** `POST`
- **Request Body:**

```json
{
  "title": "Code Reviewer",
  "description": "Reviews code against standard engineering guidelines",
  "template": "Analyze the following {{language}} code:\n\n{{code}}",
  "tags": ["engineering", "review"],
  "isFavorite": true
}
```

- **Response `201 Created`**:

```json
{
  "data": {
    "_id": "67406677...",
    "userId": "673f1122...",
    "title": "Code Reviewer",
    "description": "Reviews code against standard engineering guidelines",
    "template": "Analyze the following {{language}} code:\n\n{{code}}",
    "variables": ["language", "code"],
    "tags": ["engineering", "review"],
    "isFavorite": true,
    "createdAt": "2026-09-26T14:30:00.000Z",
    "updatedAt": "2026-09-26T14:30:00.000Z"
  }
}
```

### GET `/api/prompts/:id`

Retrieve details of a single prompt template owned by the authenticated user.

- **Auth:** Bearer Token
- **Method:** `GET`
- **Response `200 OK`**:

```json
{
  "data": {
    "_id": "67406677...",
    "title": "Code Reviewer",
    "template": "Analyze the following {{language}} code:\n\n{{code}}",
    "variables": ["language", "code"],
    "tags": ["engineering"],
    "isFavorite": true
  }
}
```

### PATCH `/api/prompts/:id`

Update prompt title, description, template, tags, or favorite flag. Re-extracts variables automatically if the template changes.

- **Auth:** Bearer Token
- **Method:** `PATCH`
- **Request Body (partial update):**

```json
{
  "title": "Senior Code Reviewer",
  "template": "Analyze the following {{language}} code with strict type-safety:\n\n{{code}}"
}
```

- **Response `200 OK`**:

```json
{
  "data": {
    "_id": "67406677...",
    "title": "Senior Code Reviewer",
    "variables": ["language", "code"]
  }
}
```

### DELETE `/api/prompts/:id`

Delete a prompt template strictly isolated to the authenticated owner.

- **Auth:** Bearer Token
- **Method:** `DELETE`
- **Response `200 OK`**:

```json
{
  "data": {
    "message": "Prompt deleted successfully",
    "id": "67406677..."
  }
}
```

---

## AI Mock Interview Platform (Step 9)

### POST `/api/interview/start`

Initiate a new interactive mock interview session with persona-calibrated greeting and initial scenario question.

- **Auth:** Bearer Token
- **Rate Limit:** 30 req/min
- **Credit Metering:** Enabled via `creditCheck` & `deductCredits` ($\lceil \text{totalTokens} / 100 \rceil$)
- **Method:** `POST`
- **Request Body:**

```json
{
  "role": "Full-Stack Engineer",
  "difficulty": "mid",
  "topic": "MERN Stack Architecture & REST/WebSocket APIs",
  "model": "flash"
}
```

- **Response `201 Created`:**

```json
{
  "session": {
    "_id": "67408899aabbccddeeff0011",
    "userId": "67401122aabbccddeeff0011",
    "role": "Full-Stack Engineer",
    "difficulty": "mid",
    "topic": "MERN Stack Architecture & REST/WebSocket APIs",
    "status": "in_progress",
    "messages": [
      {
        "role": "assistant",
        "content": "Welcome! Let's begin by discussing how you would architect real-time updates in a Node.js and MongoDB system.",
        "tokensUsed": 120,
        "timestamp": "2026-09-26T10:00:00.000Z"
      }
    ],
    "scorecard": null,
    "totalTokensUsed": 120,
    "createdAt": "2026-09-26T10:00:00.000Z",
    "updatedAt": "2026-09-26T10:00:00.000Z"
  },
  "creditsDeducted": 2,
  "creditsRemaining": 98
}
```

### POST `/api/interview/:id/respond`

Submit candidate answer (dictated or typed) and stream interviewer critique and next technical scenario question via Server-Sent Events (SSE).

- **Auth:** Bearer Token
- **Rate Limit:** 30 req/min
- **Credit Metering:** Enabled via `creditCheck` & `deductCredits`
- **Method:** `POST`
- **Request Body:**

```json
{
  "content": "I would use Socket.io or native WebSockets backed by Redis pub/sub for cross-node message broadcasting.",
  "model": "flash"
}
```

- **Response `200 OK` (Stream: `text/event-stream`):**

```text
event: token
data: {"text":"That's a solid architectural pattern. "}

event: token
data: {"text":"How would you handle backpressure if a slow consumer falls behind?"}

event: done
data: {"message":{"role":"assistant","content":"...","tokensUsed":180},"tokensUsed":180,"creditsDeducted":2,"creditsRemaining":96}
```

### POST `/api/interview/:id/conclude`

Conclude the interview, evaluate candidate responses against technical benchmarks, generate a comprehensive JSON scorecard, and auto-archive the completed interview and transcript into the Library (`type: 'interview'`).

- **Auth:** Bearer Token
- **Rate Limit:** 30 req/min
- **Credit Metering:** Enabled via `creditCheck` & `deductCredits`
- **Method:** `POST`
- **Response `200 OK`:**

```json
{
  "session": {
    "_id": "67408899aabbccddeeff0011",
    "status": "completed",
    "scorecard": {
      "overallScore": 88,
      "rating": "Strong Hire",
      "categories": {
        "technicalAccuracy": 90,
        "problemSolving": 88,
        "communication": 90,
        "systemDesign": 85
      },
      "strengths": [
        "Clear articulation of WebSocket pub/sub architecture",
        "Deep understanding of Redis scalability and buffering"
      ],
      "improvements": [
        "Further elaborate on database replica set failover strategies"
      ],
      "summary": "Excellent technical competence across full-stack architecture with structured communication.",
      "recommendedTopics": ["Redis Streams", "MongoDB Change Streams"]
    }
  },
  "libraryItem": {
    "_id": "674099aabbccddeeff0022",
    "type": "interview",
    "title": "Mock Interview: Full-Stack Engineer (MERN Stack Architecture & REST/WebSocket APIs)",
    "summary": "Excellent technical competence across full-stack architecture with structured communication.",
    "role": "Full-Stack Engineer",
    "difficulty": "mid",
    "topic": "MERN Stack Architecture & REST/WebSocket APIs",
    "scorecard": { ... },
    "transcript": [ ... ]
  },
  "creditsDeducted": 3,
  "creditsRemaining": 93
}
```

### GET `/api/interview`

List all interview sessions for the authenticated user sorted newest first.

- **Auth:** Bearer Token
- **Method:** `GET`
- **Response `200 OK`:**

```json
{
  "interviews": [
    {
      "_id": "67408899aabbccddeeff0011",
      "role": "Full-Stack Engineer",
      "difficulty": "mid",
      "topic": "MERN Stack Architecture",
      "status": "completed",
      "scorecard": { "overallScore": 88, "rating": "Strong Hire" },
      "createdAt": "2026-09-26T10:00:00.000Z"
    }
  ]
}
```

### GET `/api/interview/:id`

Retrieve details and transcript of a single interview session isolated to the user.

- **Auth:** Bearer Token
- **Method:** `GET`
- **Response `200 OK`:**

```json
{
  "interview": {
    "_id": "67408899aabbccddeeff0011",
    "role": "Full-Stack Engineer",
    "difficulty": "mid",
    "topic": "MERN Stack Architecture",
    "status": "completed",
    "messages": [ ... ],
    "scorecard": { ... }
  }
}
```



