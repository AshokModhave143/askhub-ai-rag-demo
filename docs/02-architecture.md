# 02 — Architecture

## Big picture

```
┌─────────────┐     HTTP/JWT      ┌──────────────────────┐
│  Next.js    │ ────────────────▶ │      NestJS API      │
│  web (3000) │ ◀──────────────── │        (3001)        │
└─────────────┘                   └──────────┬───────────┘
                                             │
                       ┌─────────────────────┼─────────────────────┐
                       ▼                      ▼                     ▼
                 ┌───────────┐          ┌───────────┐        ┌────────────┐
                 │  Ollama   │          │  Qdrant   │        │ FS storage │
                 │ LLM+embed │          │  vectors  │        │  uploads/  │
                 └───────────┘          └───────────┘        └────────────┘
```

## Hexagonal (ports & adapters)

The codebase follows a **ports-and-adapters** design so infrastructure is swappable without
touching business logic.

- **`core-domain`** — pure domain types (Document, ChatSession, DocumentChunk, …). No I/O.
- **`core-ports`** — interfaces the domain depends on: `ILlmAdapter`, `IVectorStore`,
  `IDocumentParser`, `IRagPipeline`, etc.
- **`rag-pipeline`** — the orchestration logic (chunk → embed → index on ingest; embed →
  search → prompt → generate on query). Depends only on **ports**, never concrete adapters.
- **adapters** — concrete implementations of the ports:

| Adapter                      | Implements     | Status                     |
| ---------------------------- | -------------- | -------------------------- |
| `adapter-llm-ollama`         | `ILlmAdapter`  | **active**                 |
| `adapter-vector-qdrant`      | `IVectorStore` | **active**                 |
| `adapter-storage-fs`         | file storage   | **active**                 |
| `adapter-auth-jwt`           | auth           | **active**                 |
| `adapter-storage-azure-blob` | file storage   | scaffold (enterprise swap) |
| `adapter-auth-entra`         | auth           | scaffold (enterprise swap) |

The API's [`RagService`](../apps/api/src/app/rag/rag.service.ts) is the composition root: it
reads config, instantiates the Ollama + Qdrant adapters, and wires them into the
`RagPipeline`. Swapping to Azure Blob / Entra later means changing wiring there, not the
pipeline.

## Monorepo layout

```
apps/
  api/        NestJS backend (auth, documents, chat, rag, health modules)
  api-e2e/    API end-to-end tests
  web/        Next.js frontend (App Router)
  web-e2e/    Playwright tests
libs/
  core-domain/        domain models
  core-ports/         port interfaces
  rag-pipeline/       RAG orchestration
  adapter-*/          infrastructure implementations
  shared-config/      env loading + validation (nest config factories)
  shared-dto/         request/response DTOs
  shared-types/       cross-cutting types
  observability/      Langfuse / OTEL helpers
  ui-kit/             shared React UI
infrastructure/
  docker-compose.yml          base services
  docker-compose.dev.yml       dev overrides
tools/scripts/        ollama-pull.sh, secrets-gen.sh
```

## Request flow — ingestion

1. `POST /api/documents/upload` (multipart). File saved to `uploads/` via the FS storage adapter.
2. Document record created with status `uploaded`; ingestion runs asynchronously.
3. `RagPipeline.ingest`: parse → `chunkText` → for each chunk call `llm.embed` (Ollama
   `nomic-embed-text`) → `vectorStore.ensureCollection` (first chunk) → upsert vectors to Qdrant.
4. Status transitions to `indexed` (with `chunkCount`) or `error` (with `errorMessage`).

## Request flow — chat query

1. `POST /api/chat/message` `{ message, sessionId?, documentIds? }`.
2. `ChatService` resolves/creates the session, appends the user message, builds recent history.
3. `RagPipeline.query`: embed the question → Qdrant similarity search (top-K, score threshold)
   → build a grounded prompt with the retrieved context → `llm.chat` (Ollama `qwen3:4b`).
4. Response: `{ answer, citations[], sessionId, messageId, timestamp }`. The assistant message
   is persisted to the session.

> **Note on the LLM:** `qwen3` is a reasoning model and emits a `<think>…</think>` block
> before its answer. The Ollama adapter strips this so the UI shows only the final answer.
> See [08 — Troubleshooting](08-troubleshooting.md).

## State & persistence

This is a **demo**: users, documents (metadata), and chat sessions live in **in-memory
stores** (`*.store.ts`) and reset when the API restarts. Vectors persist in Qdrant's Docker
volume; uploaded files persist in `uploads/`. Wiring a real database is a future step — the
store classes are the seam to do it.
