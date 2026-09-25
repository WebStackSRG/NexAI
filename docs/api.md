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
*Note: Sets `refreshToken` in an httpOnly cookie (7-day duration).*

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
*Note: Sets `refreshToken` in an httpOnly cookie.*

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
