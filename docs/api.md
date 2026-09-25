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

## Chat & Messaging (Step 3: Backend Chat)

### GET `/api/chats`

Retrieve all chat sessions belonging to the authenticated user, ordered by most recently updated.

- **Auth:** Bearer Token
- **Method:** `GET`
- **Response `200 OK`**:

```json
{
  "data": [
    {
      "_id": "673f5678...",
      "userId": "673f1234...",
      "title": "React Architecture Discussion",
      "createdAt": "2026-09-25T12:30:00.000Z",
      "updatedAt": "2026-09-25T12:35:00.000Z"
    }
  ]
}
```

### POST `/api/chats`

Create a new chat conversation.

- **Auth:** Bearer Token
- **Method:** `POST`
- **Request Body:**

```json
{
  "title": "My New Chat" // optional, defaults to "New Chat"
}
```

- **Response `201 Created`**:

```json
{
  "data": {
    "_id": "673f5678...",
    "userId": "673f1234...",
    "title": "My New Chat",
    "createdAt": "2026-09-25T12:30:00.000Z",
    "updatedAt": "2026-09-25T12:30:00.000Z"
  }
}
```

### PATCH `/api/chats/:id`

Rename an existing chat session owned by the authenticated user.

- **Auth:** Bearer Token
- **Method:** `PATCH`
- **Request Body:**

```json
{
  "title": "Updated Chat Title"
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
