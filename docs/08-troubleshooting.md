# 08 — Troubleshooting

Known gotchas, root causes, and fixes — most discovered while getting the RAG flow working.

## Upload ends in `error` with `errorMessage: "Unauthorized"`

**Cause.** The Qdrant container enables API-key auth whenever `QDRANT__SERVICE__API_KEY` is
**present, even if empty**. An empty `QDRANT_API_KEY` therefore turns on auth with an empty
key, and every request (collection create, upsert, search) is rejected `Unauthorized` — so
ingestion fails at the indexing step.

**Fix.**

1. Set a **non-empty** `QDRANT_API_KEY` in **both** `.env` and `apps/api/.env` (same value).
   The example uses `askhub-dev-local-key`.
2. Recreate the container so it picks up the key:
   ```bash
   docker compose --env-file .env \
     -f infrastructure/docker-compose.yml \
     -f infrastructure/docker-compose.dev.yml \
     up -d --force-recreate qdrant
   ```
3. Restart the API.
4. Verify: `curl -H "api-key: askhub-dev-local-key" http://localhost:6333/collections`
   should return JSON, not `Must provide an API key…`.

## Changed a value in `.env` but the API still uses the old one

**Cause.** Nx loads `apps/api/.env` **after** the root `.env`, so the app-specific file wins.
Editing only the root file has no effect on the API.

**Fix.** Set API-relevant variables (`QDRANT_API_KEY`, `JWT_SECRET`, `OLLAMA_HOST`, …) in
**both** files, then restart the API.

## Chat aborts after ~2 minutes — `AbortError: This operation was aborted`

**Cause.** A too-short request timeout against slow local inference.

**Fix.** Timeouts are set to **300s** in three places — bump them further if your hardware
needs it:

- `libs/adapter-llm-ollama/src/lib/adapter-llm-ollama.ts` (`timeoutMs` default)
- `apps/api/src/app/rag/rag.service.ts` (`timeoutMs` passed to the adapter)
- `apps/web/src/lib/api-client.ts` (axios `timeout`)

Better long-term fix: make inference faster (next item).

## Chat is extremely slow (minutes per answer)

**Cause.** **Ollama in Docker on macOS runs CPU-only** — Docker can't pass through Apple
Metal/GPU. Throughput is ~1 token/sec, so a few-hundred-token answer takes minutes.

**Fixes (pick one):**

- **Run Ollama natively** on the host (it uses Metal/GPU), then point the app at it:
  set `OLLAMA_HOST=http://localhost:11434` (host Ollama) and don't start the Docker ollama
  service. Pull models with `ollama pull qwen3:4b nomic-embed-text`.
- Use a smaller/faster chat model via `OLLAMA_CHAT_MODEL`.
- Accept the latency for demo purposes.

## Answer contains `<think>…</think>` or reasoning preamble

**Cause.** `qwen3` is a reasoning model; older Ollama (0.6.x, pinned here) ignores
`think:false` and emits a `<think>…</think>` block before the answer.

**Fix.** The Ollama adapter strips the think block (`stripThinking`) and the answer comes out
clean. If you see raw reasoning, your build is stale — **restart the API** so the latest
adapter is bundled. Upgrading the Ollama image to ≥ 0.9 makes `think:false` work natively.

## `Client version 1.18.0 is incompatible with server version 1.12.4` (Qdrant)

**Cause.** The `@qdrant/js-client-rest` (1.18) is newer than the pinned Qdrant server (1.12.4).
This is a **warning**; operations still work.

**Fix (optional).** Align versions — bump the `qdrant/qdrant` image in
`infrastructure/docker-compose.yml`, or pin the client to a 1.12-compatible release.

## Health check shows a service `down`

```bash
curl http://localhost:3001/api/health
```

- `ollama: down` → container not up or models still pulling. `docker logs askhub-ollama-init`.
- `qdrant: down` → container not up. `pnpm docker:ps`, `docker logs askhub-qdrant`.

## Port already in use

Another process owns 3000/3001/6333/11434. Find and stop it, or remap the port in `.env`:

```bash
lsof -tiTCP:3001 -sTCP:LISTEN   # find the PID on a port
```

## Reset everything

```bash
pnpm docker:reset   # stops containers AND deletes volumes (models + vectors wiped)
```

Note: users, documents (metadata), and chat sessions are **in-memory** and reset on every API
restart regardless. Vectors live in Qdrant's volume; files live in `uploads/`.
