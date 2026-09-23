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
