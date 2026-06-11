import type {
  DocumentChunk,
  ParsedDocument,
  RetrievedContext,
  RagAnswer,
  IngestResult,
} from '@askhub-ai-rag-demo/core-domain';

// ─── Storage Port ─────────────────────────────────────────────────────────────

export interface IStoragePort {
  saveFile(buffer: Buffer, filename: string, subdir?: string): Promise<string>;
  deleteFile(filePath: string): Promise<void>;
  fileExists(filePath: string): Promise<boolean>;
  readFile(filePath: string): Promise<Buffer>;
}

// ─── Document Parser Port ─────────────────────────────────────────────────────

export interface IDocumentParser {
  parse(buffer: Buffer, mimeType: string): Promise<ParsedDocument>;
}

// ─── LLM Adapter Port ─────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ChatCompletionResult {
  content: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  latencyMs: number;
}

export interface EmbeddingResult {
  embedding: number[];
  model: string;
  latencyMs: number;
}

export interface ILlmAdapter {
  chat(messages: ChatMessage[], options?: ChatCompletionOptions): Promise<ChatCompletionResult>;

  embed(text: string, model?: string): Promise<EmbeddingResult>;

  healthCheck(): Promise<boolean>;
}

// ─── Vector Store Port ────────────────────────────────────────────────────────

export interface VectorSearchOptions {
  topK?: number;
  scoreThreshold?: number;
  filter?: Record<string, unknown>;
}

export interface VectorSearchResult {
  chunk: DocumentChunk;
  score: number;
}

export interface IVectorStore {
  ensureCollection(vectorSize: number): Promise<void>;

  upsert(chunks: DocumentChunk[]): Promise<void>;

  search(embedding: number[], options?: VectorSearchOptions): Promise<VectorSearchResult[]>;

  deleteByDocumentId(documentId: string): Promise<void>;

  healthCheck(): Promise<boolean>;
}

// ─── RAG Pipeline Port ────────────────────────────────────────────────────────

export interface IngestDocumentInput {
  documentId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  owner: string;
  buffer: Buffer;
}

export interface QueryInput {
  question: string;
  sessionId: string;
  documentIds?: string[];
  topK?: number;
  chatHistory?: ChatMessage[];
}

export interface IRagPipeline {
  ingest(input: IngestDocumentInput): Promise<IngestResult>;
  query(input: QueryInput): Promise<RagAnswer>;
  retrieveContext(
    question: string,
    documentIds?: string[],
    topK?: number,
  ): Promise<RetrievedContext>;
}
