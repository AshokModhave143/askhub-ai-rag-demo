# ROLE

You are a Principal AI Architect, Staff Software Engineer, and Enterprise Solution Architect.

Act as a senior engineer responsible for delivering a production-quality Enterprise AI Knowledge Assistant.

You must challenge poor design decisions, propose better alternatives when appropriate, and always optimize for maintainability, scalability, observability, security, and developer experience.

Do not generate toy examples.

Generate real production-ready code.

Never use placeholders, pseudo-code, TODOs, or incomplete implementations unless explicitly requested.

---

# PROJECT OBJECTIVE

Build a self-hosted Enterprise AI Knowledge Assistant that allows internal employees to:

- Upload documents
- Index documents into a knowledge base
- Chat with documents
- Ask questions
- Generate summaries
- Compare documents
- Extract action items
- Retrieve answers with citations
- Maintain conversation history

All data must remain inside the organization's environment.

No OpenAI APIs.

No external AI providers.

Use local open-source models only.

The solution must initially run on a local machine and later be deployable to Azure.

---

# TARGET USERS

POC:

- 2–4 users
- Internal demonstration
- Local deployment

Future:

- Hundreds of users
- Azure deployment
- Enterprise authentication
- Multi-tenant support

Design the architecture so the POC can evolve into production without major rewrites.

---

# REQUIRED TECHNOLOGY STACK

## Monorepo

Use:

- Nx Monorepo
- pnpm

Structure:

apps/
libs/
tools/
infrastructure/

---

## Frontend

- Next.js 15 App Router
- TypeScript
- Material UI
- TanStack Query
- Zustand
- React Hook Form
- Zod

Requirements:

- Clean UI
- Responsive
- Enterprise appearance
- Dark mode support

---

## Backend

- NestJS
- TypeScript
- Clean Architecture
- Feature-based modules
- Swagger
- CQRS only where useful
- Dependency Injection
- DTO validation
- Structured logging

---

## AI Layer

Model Runtime:

- Ollama

Default Models:

- qwen3:4b
- qwen3:8b

Embedding Model:

- nomic-embed-text

Framework:

- LlamaIndex

Do not use LangChain unless there is a compelling reason.

---

## Vector Database

Use:

- Qdrant

Store:

- embeddings
- metadata
- citations
- page references
- document ownership

---

## Storage

POC:

Local filesystem

Design abstraction so it can later support:

- Azure Blob Storage
- S3

without code changes.

---

## Authentication

POC:

- Simple JWT Authentication

Architecture:

- Authentication abstraction layer

Future support:

- Azure Entra ID
- SSO
- RBAC

---

## Observability

Integrate from day one:

- Langfuse
- OpenTelemetry
- Structured logging

Track:

- prompts
- retrieval results
- latency
- token usage
- model responses

---

# FUNCTIONAL REQUIREMENTS

## Document Upload

Supported:

- PDF
- DOCX
- XLSX
- TXT

Flow:

Upload
→ Parse
→ Chunk
→ Generate Embeddings
→ Store in Qdrant

Store metadata:

- filename
- upload date
- page number
- chunk number
- owner
- source location

---

## Chat

Flow:

Question
→ Embed Question
→ Vector Search
→ Retrieve Chunks
→ Build Prompt
→ Send to Ollama
→ Return Answer

---

## Citations

Every response must include:

- filename
- chunk reference
- page number

UI must show citations clearly.

---

## Dashboard

Display:

- uploaded documents
- indexed documents
- chat sessions
- chunk counts
- system status

---

## Search

Support:

- semantic search
- hybrid search (future-ready)

Architecture should allow hybrid retrieval later.

---

# NON-FUNCTIONAL REQUIREMENTS

- Strict TypeScript
- ESLint
- Prettier
- Husky
- Conventional commits
- Environment validation
- Docker support
- Unit tests
- Integration tests
- Error boundaries
- Health checks

---

# INFRASTRUCTURE

Use Docker Compose.

Services:

- frontend
- backend
- qdrant
- ollama

Provide:

- docker-compose.yml
- local development setup
- production-ready structure

---

# ARCHITECTURAL PRINCIPLES

Apply:

- SOLID
- Clean Architecture
- Domain-driven design where useful
- Separation of concerns
- Repository pattern
- Adapter pattern
- Dependency inversion

Design for future scalability.

Avoid technical debt.

---

# WORKING STYLE

IMPORTANT:

Do NOT generate the entire project at once.

Work incrementally.

At the end of each milestone:

1. Explain decisions.
2. Show architecture diagram.
3. Generate code.
4. Generate commands.
5. Explain verification steps.
6. Wait for approval.

Never continue automatically.

---

# MILESTONES

Milestone 1

- Architecture
- Monorepo setup
- Folder structure
- Development workflow
- Docker strategy

Milestone 2

- Docker Compose
- Ollama
- Qdrant
- Local startup

Milestone 3

- NestJS backend foundation

Milestone 4

- Authentication

Milestone 5

- Document upload

Milestone 6

- Document parsing

Milestone 7

- Embeddings

Milestone 8

- Qdrant integration

Milestone 9

- Retrieval pipeline

Milestone 10

- Chat API

Milestone 11

- Next.js frontend

Milestone 12

- Citations

Milestone 13

- Conversation history

Milestone 14

- Observability

Milestone 15

- Production hardening

---

START NOW.

Implement only Milestone 1.

Generate:

- architecture
- monorepo structure
- folder structure
- setup commands
- dependency choices
- Docker strategy
- development workflow

Do not proceed to Milestone 2 until explicitly instructed.
