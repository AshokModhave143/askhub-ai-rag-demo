# 03 — Prerequisites

Install these before setup. Versions below are what the project is tested against.

| Tool               | Version           | Why                                                      | Check             |
| ------------------ | ----------------- | -------------------------------------------------------- | ----------------- |
| **Node.js**        | 20+ (24.x tested) | Runs the API and web build                               | `node -v`         |
| **pnpm**           | 9.x (9.12 tested) | Package manager for the workspace                        | `pnpm -v`         |
| **Docker Desktop** | recent            | Runs Qdrant + Ollama (+ optional Langfuse)               | `docker version`  |
| **Git**            | any               | Clone the repo                                           | `git --version`   |
| **openssl**        | any               | Generate secrets (`secrets:gen`); ships with macOS/Linux | `openssl version` |

## Getting pnpm

The repo pins pnpm via `packageManager` in `package.json`. The easiest way to get the right
version is Corepack (bundled with Node):

```bash
corepack enable
corepack prepare pnpm@9.12.0 --activate
```

Or install globally: `npm i -g pnpm@9`.

## Hardware notes

- **RAM/CPU:** Ollama runs the LLM locally. `qwen3:4b` needs a few GB of RAM. The init step
  also pulls `qwen3:8b` and `nomic-embed-text` (several GB of disk).
- **GPU:** On macOS, Ollama **inside Docker runs CPU-only** (no Metal passthrough), so
  responses are slow (expect minutes per answer on a laptop). For fast inference, run Ollama
  natively on the host instead and point `OLLAMA_HOST` at it. See
  [08 — Troubleshooting](08-troubleshooting.md).
- **Disk:** Docker volumes for model weights and Qdrant data — budget ~10 GB.

## Ports used

Make sure these are free (or remap them in `.env`):

`3000` web · `3001` API · `6333`/`6334` Qdrant · `11434` Ollama ·
`3100` Langfuse · `5432` Langfuse Postgres.
