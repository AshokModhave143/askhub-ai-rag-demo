# AskHub AI — Documentation

AskHub AI is a **self-hosted, private RAG (Retrieval-Augmented Generation) knowledge assistant**.
Upload your documents, then ask questions and get answers grounded in their content — with
citations back to the exact source chunks. Everything runs locally: the LLM, the vector
database, and the app. No data leaves your machine.

This folder is the full guide, from "what is it" to "running it on a fresh machine".

## Table of contents

| Doc                                           | What it covers                                       |
| --------------------------------------------- | ---------------------------------------------------- |
| [01 — Overview](01-overview.md)               | What the project is, core features, the tech stack   |
| [02 — Architecture](02-architecture.md)       | Hexagonal design, the Nx monorepo, request/data flow |
| [03 — Prerequisites](03-prerequisites.md)     | Tools you need before you start                      |
| [04 — Setup & Run](04-setup-and-run.md)       | Step-by-step install on a new machine                |
| [05 — Using the App](05-usage.md)             | Login → upload → chat walkthrough                    |
| [06 — Configuration](06-configuration.md)     | Every environment variable, explained                |
| [07 — API Reference](07-api-reference.md)     | REST endpoints and Swagger                           |
| [08 — Troubleshooting](08-troubleshooting.md) | Known gotchas and fixes                              |
| [09 — Development](09-development.md)         | Project layout, Nx commands, adding code             |

> Background: the original product brief is in [REQUIREMENT.md](REQUIREMENT.md); scratch dev
> notes in [DEV_NOTES.md](DEV_NOTES.md).

## TL;DR — get it running

```bash
# 1. Prerequisites: Node 20+ (24 tested), pnpm, Docker Desktop
corepack enable

# 2. Install deps
pnpm install

# 3. Create your .env (copy the example, then generate real secrets)
cp .env.example .env
pnpm secrets:gen   # paste output into .env

# 4. Start infra (Qdrant + Ollama + model pull)
pnpm docker:up

# 5. Run the backend and frontend (two terminals)
pnpm exec nx run @askhub-ai-rag-demo/api:serve   # API → http://localhost:3001
pnpm exec nx run @askhub-ai-rag-demo/web:dev     # Web → http://localhost:3000
```

Open <http://localhost:3000>, register the first user (becomes **admin**), upload a document,
and start asking questions. Full detail in [04 — Setup & Run](04-setup-and-run.md).
