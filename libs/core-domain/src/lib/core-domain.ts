// ─── Document Domain ─────────────────────────────────────────────────────────

export type DocumentStatus = 'uploaded' | 'parsing' | 'parsed' | 'embedding' | 'indexed' | 'error';

export interface DocumentMetadata {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  owner: string;
  status: DocumentStatus;
  chunkCount?: number;
  pageCount?: number;
  errorMessage?: string;
  uploadedAt: Date;
  updatedAt: Date;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  pageNumber?: number;
  embedding?: number[];
  metadata: {
    filename: string;
    originalName: string;
    owner: string;
    source: string;
  };
}

export interface ParsedPage {
  pageNumber: number;
  text: string;
}

export interface ParsedDocument {
  text: string;
  pageCount?: number;
  pages?: ParsedPage[];
}

// ─── Chat / Conversation Domain ───────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ConversationMessage {
  id: string;
  role: MessageRole;
  content: string;
  citations?: Citation[];
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ConversationMessage[];
  documentIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── RAG Domain ───────────────────────────────────────────────────────────────

export interface Citation {
  documentId: string;
  filename: string;
  chunkIndex: number;
  pageNumber?: number;
  content: string;
  score: number;
}

export interface RetrievedContext {
  chunks: DocumentChunk[];
  citations: Citation[];
}

export interface RagAnswer {
  answer: string;
  citations: Citation[];
  sessionId: string;
  model: string;
  latencyMs: number;
  promptTokens?: number;
  completionTokens?: number;
}

export interface IngestResult {
  documentId: string;
  chunkCount: number;
  pageCount?: number;
  latencyMs: number;
}
