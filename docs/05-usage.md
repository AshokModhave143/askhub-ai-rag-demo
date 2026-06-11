# 05 — Using the App

A walkthrough of the four screens. Base URL: <http://localhost:3000>.

## Login / Register (`/login`)

- **Register** tab: email, name, password. The **first account created becomes `admin`**;
  everyone after is a regular `user`.
- **Sign In** tab: email + password. On success a JWT is stored in `localStorage`
  (`access_token`) and attached to every API request.
- Tokens expire after `JWT_EXPIRES_IN` (default 12h). A `401` anywhere clears the token and
  bounces you back to login.

## Dashboard (`/dashboard`)

At-a-glance system state:

- **System status** — green "Operational" when the API health check passes.
- **Total Documents / Indexed / Errors** — counts and total size.
- **Chat Sessions** — number of conversations and messages.
- **Document Pipeline** — breakdown by status.
- **Recent Conversations** — quick links into chat history.

## Documents (`/documents`)

- **Upload** — drag-and-drop or **Browse Files**. Supported: PDF, DOCX, XLSX, TXT, CSV.
  Max size = `MAX_UPLOAD_MB` (default 50 MB).
- **Table** — each document shows Type, Size, **Status**, Chunks, Pages, Uploaded date, and a
  delete action.
- **Status lifecycle:** `uploaded → parsing → embedding → indexed`. A failure shows `error`
  with a message (hover/expand). Only `indexed` documents are searchable in chat.
- Indexing is asynchronous; the list reflects progress. On CPU-only Ollama, embedding a large
  file takes a while.

## Chat (`/chat`)

- **New Chat** starts a fresh session. Past sessions are listed in the sidebar with their
  message count; click to reopen. Delete with the trash icon.
- Type a question and send (Enter; Shift+Enter for a newline).
- The assistant answers **using only your indexed documents**. Each answer shows:
  - the **answer text** (reasoning is stripped — you see only the conclusion),
  - **source citations** — document + chunk, each with a relevance **score** (e.g. `75%`),
    expandable to preview the cited chunk.
- Conversation history is fed back as context, so follow-up questions work.

> If a document isn't indexed yet, the assistant won't find it — check the Documents page
> first.

## Tips

- Answers are **grounded** — if the documents don't contain the answer, the model is
  instructed to say so rather than guess.
- Responses are slow on CPU-only Ollama (minutes is normal). For speed, run Ollama natively;
  see [08 — Troubleshooting](08-troubleshooting.md).
