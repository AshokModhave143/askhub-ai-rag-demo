# 09 — Development

## Workspace at a glance

Nx monorepo, pnpm workspaces. Projects are named `@askhub-ai-rag-demo/<name>`.

```
apps/   api, api-e2e, web, web-e2e
libs/   core-domain, core-ports, rag-pipeline,
        adapter-llm-ollama, adapter-vector-qdrant, adapter-storage-fs,
        adapter-storage-azure-blob, adapter-auth-jwt, adapter-auth-entra,
        shared-config, shared-dto, shared-types, observability, ui-kit
```

Layering rule (enforced by the hexagonal design): `apps → adapters → rag-pipeline → core-ports
→ core-domain`. The domain and ports never import adapters.

## Everyday commands

| Task                                  | Command                                                   |
| ------------------------------------- | --------------------------------------------------------- |
| Install                               | `pnpm install`                                            |
| Run API (watch)                       | `pnpm exec nx run @askhub-ai-rag-demo/api:serve`          |
| Run web (watch)                       | `pnpm exec nx run @askhub-ai-rag-demo/web:dev`            |
| Typecheck all                         | `pnpm typecheck`                                          |
| Lint all                              | `pnpm lint` · fix: `pnpm lint:fix`                        |
| Lint changed only                     | `pnpm lint:affected`                                      |
| Format                                | `pnpm format` · check: `pnpm format:check`                |
| Build one project                     | `pnpm exec nx build @askhub-ai-rag-demo/api`              |
| Run a single project's lint/typecheck | `pnpm exec nx run-many -t lint -p adapter-llm-ollama api` |
| Project graph                         | `pnpm exec nx graph`                                      |

## Docker / infra scripts

| Script               | Action                            |
| -------------------- | --------------------------------- |
| `pnpm docker:up`     | Qdrant + Ollama + model pull      |
| `pnpm docker:up:obs` | Langfuse + its Postgres           |
| `pnpm docker:up:all` | Everything                        |
| `pnpm docker:down`   | Stop containers (keep volumes)    |
| `pnpm docker:reset`  | Stop + delete volumes             |
| `pnpm docker:logs`   | Follow logs                       |
| `pnpm docker:ps`     | Container status                  |
| `pnpm ollama:pull`   | Pull models into a running Ollama |
| `pnpm secrets:gen`   | Generate secrets for `.env`       |

## Tests

- API e2e: `pnpm exec nx e2e @askhub-ai-rag-demo/api-e2e`
- Web e2e (Playwright): `pnpm exec nx e2e @askhub-ai-rag-demo/web-e2e`

## Where things live

| You want to…                                                | Edit                                                                                  |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Change RAG chunking / retrieval / prompt                    | `libs/rag-pipeline/src/lib/rag-pipeline.ts`                                           |
| Change how the LLM is called (timeout, think-strip, params) | `libs/adapter-llm-ollama/src/lib/adapter-llm-ollama.ts`                               |
| Change vector store behavior                                | `libs/adapter-vector-qdrant/src/lib/adapter-vector-qdrant.ts`                         |
| Wire which adapters are used                                | `apps/api/src/app/rag/rag.service.ts`                                                 |
| Add/modify an API endpoint                                  | `apps/api/src/app/<module>/*.controller.ts`                                           |
| Add env vars                                                | `libs/shared-config/src/lib/config.factories.ts` + `.env(.example)` + `apps/api/.env` |
| Frontend pages                                              | `apps/web/src/app/<route>/page.tsx`                                                   |
| Frontend API calls                                          | `apps/web/src/lib/api-client.ts`                                                      |
| Auth (login state)                                          | `apps/web/src/store/auth.store.ts`, `apps/web/src/components/AuthGuard.tsx`           |

## Adding a new adapter (example: swap storage to Azure Blob)

1. Implement the port interface from `core-ports` in `adapter-storage-azure-blob`.
2. Add any config to `shared-config` and the `.env` files.
3. Wire it in the composition root (`rag.service.ts` or the relevant module provider).
4. The pipeline and domain stay untouched — that's the point of ports & adapters.

## Conventions

- **Commits:** Conventional Commits (`feat:`, `fix:`, …); enforced via commitlint + Husky.
- **Pre-commit:** lint-staged runs ESLint + Prettier on staged files.
- **Code style:** Prettier; run `pnpm format` before pushing.

## Notes for production-hardening

This is a demo. Before real use, replace the in-memory stores (`*.store.ts`) with a database,
add refresh-token handling, move secrets out of committed env files, align the Qdrant
client/server versions, and run Ollama with GPU.
