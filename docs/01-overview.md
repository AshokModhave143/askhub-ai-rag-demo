# 01 — Overview

## What it is

AskHub AI is an **enterprise knowledge assistant** built on the RAG pattern. You feed it
documents (PDF, DOCX, XLSX, TXT, CSV); it parses, chunks, embeds, and indexes them in a
vector database. When you ask a question, it retrieves the most relevant chunks and asks a
local LLM to answer **using only that context**, returning the answer plus citations.

The whole stack is **self-hosted and private**:

- **LLM inference** runs on [Ollama](https://ollama.com) (default model `qwen3:4b`).
- **Vector search** runs on [Qdrant](https://qdrant.tech).
- **App** is a NestJS API + Next.js web client.

No third-party AI APIs, no data egress.

## Core features

- **Document ingestion** — drag-and-drop upload; automatic parse → chunk → embed → index.
  Live status per document (`uploaded → parsing → embedding → indexed`, or `error`).
- **Grounded chat** — answers cite the source document and chunk, with a relevance score.
- **Chat sessions** — conversations are persisted; history is fed back as context.
- **Auth** — JWT register/login. The first registered user is promoted to `admin`.
- **Dashboard** — document counts, index status, chat sessions, error totals, system health.
- **Observability hooks** — optional Langfuse + OpenTelemetry wiring.

## Tech stack

| Layer          | Technology                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------ |
| Monorepo       | [Nx](https://nx.dev) 20 + pnpm workspaces                                                                          |
| Backend        | [NestJS](https://nestjs.com) 10, class-validator, Swagger/OpenAPI                                                  |
| Auth           | Passport JWT, bcryptjs                                                                                             |
| Frontend       | [Next.js](https://nextjs.org) (App Router), React, [MUI](https://mui.com) v9                                       |
| Frontend state | [Zustand](https://zustand-demo.pmnd.rs) (auth), [TanStack Query](https://tanstack.com/query) (server state), axios |
| LLM            | Ollama — chat `qwen3:4b`, embeddings `nomic-embed-text`                                                            |
| Vector DB      | Qdrant (`@qdrant/js-client-rest`)                                                                                  |
| Doc parsing    | pdf-parse and friends                                                                                              |
| Infra          | Docker Compose                                                                                                     |

## What runs where

| Component           | Default URL                    | Provided by        |
| ------------------- | ------------------------------ | ------------------ |
| Web app             | http://localhost:3000          | `nx run web:dev`   |
| REST API            | http://localhost:3001/api      | `nx run api:serve` |
| Swagger docs        | http://localhost:3001/api/docs | NestJS             |
| Qdrant              | http://localhost:6333          | Docker             |
| Ollama              | http://localhost:11434         | Docker             |
| Langfuse (optional) | http://localhost:3100          | Docker             |

See [02 — Architecture](02-architecture.md) for how these fit together.
