# 06 — Configuration

All configuration is via environment variables. Copy `.env.example` → `.env` and fill it in.

## Two env files (important)

| File            | Used by                                                          | Notes                                                          |
| --------------- | ---------------------------------------------------------------- | -------------------------------------------------------------- |
| `.env` (root)   | `docker compose --env-file .env …` (all `pnpm docker:*` scripts) | Drives the **containers** (Qdrant key, Langfuse, ports).       |
| `apps/api/.env` | The NestJS API at runtime                                        | **Nx loads this _after_ the root `.env`, so it overrides it.** |

Because of the override, any value the **API** reads (e.g. `QDRANT_API_KEY`, `JWT_SECRET`,
`OLLAMA_HOST`) must be consistent in **both** files. The root `.env` is what the Qdrant
container is created with, so the key must match what the API sends.

## Variable reference

### Ports

| Var                | Default | Purpose                          |
| ------------------ | ------- | -------------------------------- |
| `WEB_PORT`         | 3000    | Next.js web app                  |
| `API_PORT`         | 3001    | NestJS API (`PORT` also honored) |
| `QDRANT_HTTP_PORT` | 6333    | Qdrant REST                      |
| `QDRANT_GRPC_PORT` | 6334    | Qdrant gRPC                      |
| `OLLAMA_PORT`      | 11434   | Ollama                           |
| `LANGFUSE_PORT`    | 3100    | Langfuse UI (optional)           |
| `LANGFUSE_PG_PORT` | 5432    | Langfuse Postgres (optional)     |

### Ollama (LLM)

| Var                 | Default                            | Purpose                                                            |
| ------------------- | ---------------------------------- | ------------------------------------------------------------------ |
| `OLLAMA_HOST`       | http://localhost:11434             | Ollama endpoint. Point at a **native** host install for GPU speed. |
| `OLLAMA_MODELS`     | qwen3:4b,qwen3:8b,nomic-embed-text | Models the init step pulls.                                        |
| `OLLAMA_KEEP_ALIVE` | 30m                                | How long a model stays warm in memory.                             |
| `OLLAMA_CHAT_MODEL` | qwen3:4b                           | Chat model (read by the API; set to override).                     |

### Qdrant (vector DB)

| Var                 | Default               | Purpose                                                                                                           |
| ------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `QDRANT_URL`        | http://localhost:6333 | Qdrant endpoint.                                                                                                  |
| `QDRANT_API_KEY`    | askhub-dev-local-key  | **Must be non-empty** (empty enables empty-key auth → all requests `Unauthorized`). Same value in both env files. |
| `QDRANT_COLLECTION` | askhub_docs           | Collection name for document vectors.                                                                             |

### API

| Var              | Default               | Purpose                                       |
| ---------------- | --------------------- | --------------------------------------------- |
| `NODE_ENV`       | development           | Standard Node env.                            |
| `LOG_LEVEL`      | debug                 | Log verbosity.                                |
| `JWT_SECRET`     | _(generate)_          | Signs JWTs. Use `pnpm secrets:gen`.           |
| `JWT_EXPIRES_IN` | 12h                   | Token lifetime.                               |
| `UPLOAD_DIR`     | ./uploads             | Where uploaded files are stored (FS adapter). |
| `MAX_UPLOAD_MB`  | 50                    | Max upload size.                              |
| `WEB_URL`        | http://localhost:3000 | Allowed CORS origin for the API.              |

### Web

| Var                   | Default                   | Purpose                         |
| --------------------- | ------------------------- | ------------------------------- |
| `NEXT_PUBLIC_API_URL` | http://localhost:3001/api | API base URL the browser calls. |

### Langfuse (optional observability)

| Var                                             | Purpose                                |
| ----------------------------------------------- | -------------------------------------- | ------------------ |
| `LANGFUSE_PG_USER` / `_PASSWORD` / `_DB`        | Postgres backing Langfuse.             |
| `LANGFUSE_SECRET` / `_SALT` / `_ENCRYPTION_KEY` | Langfuse secrets (`pnpm secrets:gen`). |
| `NEXTAUTH_SECRET`                               | Langfuse auth secret.                  |
| `LANGFUSE_PUBLIC_KEY` / `_SECRET_KEY`           | API keys (created in the Langfuse UI). |
| `LANGFUSE_HOST`                                 | http://localhost:3100                  | Langfuse endpoint. |

### OpenTelemetry (optional)

| Var                           | Default               | Purpose                  |
| ----------------------------- | --------------------- | ------------------------ |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | http://localhost:4318 | OTLP collector endpoint. |
| `OTEL_SERVICE_NAME`           | askhub-api            | Service name in traces.  |

## Generating secrets

```bash
pnpm secrets:gen
```

Prints fresh values for `JWT_SECRET`, `LANGFUSE_SECRET`, `LANGFUSE_SALT`,
`LANGFUSE_ENCRYPTION_KEY`, `NEXTAUTH_SECRET`. Paste into `.env` (and mirror API-relevant ones
into `apps/api/.env`).
