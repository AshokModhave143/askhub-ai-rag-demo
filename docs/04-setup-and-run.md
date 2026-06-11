# 04 — Setup & Run (fresh machine)

Follow these in order. Assumes the [prerequisites](03-prerequisites.md) are installed.

## 1. Clone and install

```bash
git clone <your-repo-url> askhub-ai-rag-demo
cd askhub-ai-rag-demo
corepack enable          # if you haven't already
pnpm install
```

## 2. Create your environment file

```bash
cp .env.example .env
```

Then generate real secrets and paste them into `.env`:

```bash
pnpm secrets:gen
```

This prints values for `JWT_SECRET`, `LANGFUSE_SECRET`, `LANGFUSE_SALT`,
`LANGFUSE_ENCRYPTION_KEY`, and `NEXTAUTH_SECRET`. Replace the `replace-with-…` placeholders
in `.env` with them.

> **Important — Qdrant key.** Leave `QDRANT_API_KEY` set to a **non-empty** value
> (the example ships `askhub-dev-local-key`). An empty value makes Qdrant reject every
> request as `Unauthorized`. See [08 — Troubleshooting](08-troubleshooting.md).

> **Note — second env file.** The API also reads `apps/api/.env`, and with Nx that file's
> values **override** the root `.env`. If you change a value the API uses (e.g.
> `QDRANT_API_KEY`, `JWT_SECRET`), set it in **both** files. Full table in
> [06 — Configuration](06-configuration.md).

Every variable is documented in [06 — Configuration](06-configuration.md).

## 3. Start infrastructure (Qdrant + Ollama)

```bash
pnpm docker:up
```

This starts Qdrant and Ollama, then runs `ollama-init` which **pulls the models**
(`qwen3:4b`, `qwen3:8b`, `nomic-embed-text`). The first run downloads several GB — give it
time. Watch progress:

```bash
pnpm docker:logs            # all services
docker logs askhub-ollama-init   # model pull progress
pnpm docker:ps              # status
```

Verify services are healthy:

```bash
curl http://localhost:6333/healthz                    # qdrant → "healthz check passed"
curl http://localhost:11434/api/tags                  # ollama → JSON list of models
```

(Optional) start Langfuse for tracing: `pnpm docker:up:obs` — or everything: `pnpm docker:up:all`.

## 4. Run the backend

```bash
pnpm exec nx run @askhub-ai-rag-demo/api:serve
```

Wait for `🚀 Application is running on: http://localhost:3001/api`. Sanity check:

```bash
curl http://localhost:3001/api/health
# {"status":"ok","services":{"ollama":{"status":"up"},"qdrant":{"status":"up"}}}
```

## 5. Run the frontend (new terminal)

```bash
pnpm exec nx run @askhub-ai-rag-demo/web:dev
```

Open <http://localhost:3000>.

## 6. First use

1. Click **Register** and create an account — **the first user becomes `admin`**.
2. Go to **Documents** → upload a file (PDF / DOCX / XLSX / TXT / CSV, ≤ 50 MB).
3. Wait for the status to reach **`indexed`** (slow on CPU-only Ollama — this is normal).
4. Go to **Chat** and ask a question about the document. The answer includes citations.

Full walkthrough: [05 — Using the App](05-usage.md).

## Stopping & cleanup

```bash
# stop API/web: Ctrl-C in their terminals
pnpm docker:down            # stop containers (keep data/volumes)
pnpm docker:reset           # stop AND delete volumes (wipes models + vectors)
```

## Common first-run issues

| Symptom                              | Fix                                                                                                                                                                                                                                                                                      |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Upload stuck → `error: Unauthorized` | `QDRANT_API_KEY` empty or mismatched — set the same non-empty value in `.env`, `apps/api/.env`, then recreate qdrant: `docker compose --env-file .env -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.dev.yml up -d --force-recreate qdrant`, and restart the API. |
| Chat aborts after ~2 min             | Slow CPU inference hit a timeout. Timeouts are set to 300s; if still hitting it, run Ollama natively or raise the timeout.                                                                                                                                                               |
| Answer contains `<think>…` text      | Stale build — restart the API so the latest `adapter-llm-ollama` is bundled.                                                                                                                                                                                                             |
| Port already in use                  | Another process owns 3000/3001/6333/11434 — stop it or remap ports in `.env`.                                                                                                                                                                                                            |

More in [08 — Troubleshooting](08-troubleshooting.md).
