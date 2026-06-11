# 07 — API Reference

Base URL: `http://localhost:3001/api`. Interactive docs (try requests in the browser):
**<http://localhost:3001/api/docs>** (Swagger, with "Authorize" for bearer tokens).

All endpoints except `auth/register`, `auth/login`, and `health` require a
`Authorization: Bearer <token>` header.

## Auth

| Method | Path             | Body                        | Description                                                     |
| ------ | ---------------- | --------------------------- | --------------------------------------------------------------- |
| `POST` | `/auth/register` | `{ email, password, name }` | Create account. **First user → `admin`.** Returns token + user. |
| `POST` | `/auth/login`    | `{ email, password }`       | Returns token + user.                                           |
| `GET`  | `/auth/me`       | —                           | Current user (from token).                                      |

**Auth response shape:**

```json
{
  "accessToken": "eyJ…",
  "expiresIn": "12h",
  "user": { "id": "…", "email": "…", "name": "…", "role": "admin" }
}
```

## Documents

| Method   | Path                | Description                                                          |
| -------- | ------------------- | -------------------------------------------------------------------- |
| `POST`   | `/documents/upload` | Multipart `file`. Returns the document record; ingestion runs async. |
| `GET`    | `/documents`        | List the caller's documents.                                         |
| `GET`    | `/documents/stats`  | `{ total, byStatus, totalSizeBytes }`.                               |
| `GET`    | `/documents/:id`    | One document.                                                        |
| `DELETE` | `/documents/:id`    | Delete a document (and its vectors).                                 |

**Document record:**

```json
{
  "id": "…",
  "originalName": "report.pdf",
  "mimeType": "application/pdf",
  "size": 12345,
  "status": "indexed",
  "chunkCount": 12,
  "pageCount": 4,
  "owner": "…",
  "uploadedAt": "…",
  "updatedAt": "…",
  "errorMessage": null
}
```

Status values: `uploaded`, `parsing`, `embedding`, `indexed`, `error`.

## Chat

| Method   | Path                 | Body                                    | Description                                               |
| -------- | -------------------- | --------------------------------------- | --------------------------------------------------------- |
| `POST`   | `/chat/message`      | `{ message, sessionId?, documentIds? }` | Ask a question. Creates a session if `sessionId` omitted. |
| `GET`    | `/chat/sessions`     | —                                       | List the caller's sessions.                               |
| `GET`    | `/chat/sessions/:id` | —                                       | One session with full message history.                    |
| `DELETE` | `/chat/sessions/:id` | —                                       | Delete a session.                                         |

**Send-message response:**

```json
{
  "sessionId": "…",
  "messageId": "…",
  "answer": "AskHub's project codename is Falcon and it uses Qdrant…",
  "citations": [
    {
      "documentId": "…",
      "filename": "sample.txt",
      "chunkIndex": 0,
      "pageNumber": null,
      "content": "…",
      "score": 0.75
    }
  ],
  "timestamp": "…"
}
```

> Chat is synchronous and can take **minutes** on CPU-only Ollama. The API and web client
> both use a 300s timeout.

## Health

| Method | Path            | Description                                                |
| ------ | --------------- | ---------------------------------------------------------- |
| `GET`  | `/health`       | Overall status + per-service (`ollama`, `qdrant`) up/down. |
| `GET`  | `/health/live`  | Liveness probe.                                            |
| `GET`  | `/health/ready` | Readiness probe.                                           |

## Quick curl smoke test

```bash
BASE=http://localhost:3001/api
TOK=$(curl -s -X POST $BASE/auth/register -H 'Content-Type: application/json' \
  -d '{"email":"me@demo.com","password":"Passw0rd!","name":"Me"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['accessToken'])")

curl -s -X POST $BASE/documents/upload -H "Authorization: Bearer $TOK" -F "file=@./notes.txt"
curl -s $BASE/documents -H "Authorization: Bearer $TOK"          # wait for status: indexed
curl -s -X POST $BASE/chat/message -H "Authorization: Bearer $TOK" \
  -H 'Content-Type: application/json' -d '{"message":"Summarize the document."}'
```
