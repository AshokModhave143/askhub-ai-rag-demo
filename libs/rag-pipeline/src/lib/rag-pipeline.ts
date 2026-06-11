import { v4 as uuidv4 } from 'uuid';

import type {
  DocumentChunk,
  Citation,
  RagAnswer,
  IngestResult,
  RetrievedContext,
} from '@askhub-ai-rag-demo/core-domain';
import type {
  ILlmAdapter,
  IVectorStore,
  IDocumentParser,
  IRagPipeline,
  IngestDocumentInput,
  QueryInput,
  ChatMessage,
} from '@askhub-ai-rag-demo/core-ports';

// ─── Chunking ─────────────────────────────────────────────────────────────────

const DEFAULT_CHUNK_SIZE = 512; // tokens ≈ characters / 4
const DEFAULT_CHUNK_OVERLAP = 64;
const EMBED_VECTOR_SIZE = 768; // nomic-embed-text dimension

function chunkText(
  text: string,
  chunkSize = DEFAULT_CHUNK_SIZE * 4,
  overlap = DEFAULT_CHUNK_OVERLAP * 4,
): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 20) {
      chunks.push(chunk);
    }
    start += chunkSize - overlap;
  }

  return chunks;
}

// ─── Prompt Builder ───────────────────────────────────────────────────────────

function buildRagPrompt(
  question: string,
  context: string,
  chatHistory: ChatMessage[],
): ChatMessage[] {
  const systemPrompt = `You are an expert enterprise knowledge assistant. 
Answer questions accurately and concisely using ONLY the provided context.
If the context does not contain sufficient information, say so clearly.
Always cite the source documents when answering.
Format your response in clear, professional language.`;

  const contextMessage = `Context from knowledge base:
---
${context}
---

Based on the above context, please answer the following question.`;

  const messages: ChatMessage[] = [{ role: 'system', content: systemPrompt }];

  // Add limited chat history (last 4 exchanges = 8 messages)
  const recentHistory = chatHistory.slice(-8);
  messages.push(...recentHistory);

  messages.push({ role: 'user', content: `${contextMessage}\n\nQuestion: ${question}` });

  return messages;
}

// ─── RAG Pipeline Implementation ──────────────────────────────────────────────

export interface RagPipelineConfig {
  chunkSize?: number;
  chunkOverlap?: number;
  topK?: number;
  scoreThreshold?: number;
}

export class RagPipeline implements IRagPipeline {
  private readonly chunkSize: number;
  private readonly chunkOverlap: number;
  private readonly defaultTopK: number;
  private readonly scoreThreshold: number;

  constructor(
    private readonly llm: ILlmAdapter,
    private readonly vectorStore: IVectorStore,
    private readonly documentParser: IDocumentParser,
    config: RagPipelineConfig = {},
  ) {
    this.chunkSize = config.chunkSize ?? DEFAULT_CHUNK_SIZE * 4;
    this.chunkOverlap = config.chunkOverlap ?? DEFAULT_CHUNK_OVERLAP * 4;
    this.defaultTopK = config.topK ?? 5;
    this.scoreThreshold = config.scoreThreshold ?? 0.3;
  }

  async ingest(input: IngestDocumentInput): Promise<IngestResult> {
    const start = Date.now();

    // 1. Parse document
    const parsed = await this.documentParser.parse(input.buffer, input.mimeType);

    // 2. Split into chunks
    const rawChunks = chunkText(parsed.text, this.chunkSize, this.chunkOverlap);

    if (rawChunks.length === 0) {
      throw new Error('Document produced no text chunks after parsing');
    }

    // 3. Embed all chunks and build DocumentChunk objects
    const chunks: DocumentChunk[] = [];

    for (let i = 0; i < rawChunks.length; i++) {
      const content = rawChunks[i];
      const embedResult = await this.llm.embed(content);

      // Ensure collection exists on first chunk
      if (i === 0) {
        await this.vectorStore.ensureCollection(embedResult.embedding.length || EMBED_VECTOR_SIZE);
      }

      chunks.push({
        id: uuidv4(),
        documentId: input.documentId,
        content,
        chunkIndex: i,
        embedding: embedResult.embedding,
        metadata: {
          filename: input.filename,
          originalName: input.originalName,
          owner: input.owner,
          source: `${input.originalName}#chunk${i}`,
        },
      });
    }

    // 4. Upsert into vector store
    await this.vectorStore.upsert(chunks);

    return {
      documentId: input.documentId,
      chunkCount: chunks.length,
      pageCount: parsed.pageCount,
      latencyMs: Date.now() - start,
    };
  }

  async retrieveContext(
    question: string,
    documentIds?: string[],
    topK?: number,
  ): Promise<RetrievedContext> {
    // Embed the question
    const queryEmbedding = await this.llm.embed(question);

    const results = await this.vectorStore.search(queryEmbedding.embedding, {
      topK: topK ?? this.defaultTopK,
      scoreThreshold: this.scoreThreshold,
      ...(documentIds && documentIds.length === 1
        ? { filter: { documentId: documentIds[0] } }
        : {}),
    });

    // Filter by documentIds client-side if multiple
    const filtered =
      documentIds && documentIds.length > 1
        ? results.filter((r) => documentIds.includes(r.chunk.documentId))
        : results;

    const citations: Citation[] = filtered.map((r) => ({
      documentId: r.chunk.documentId,
      filename: r.chunk.metadata.filename,
      chunkIndex: r.chunk.chunkIndex,
      pageNumber: r.chunk.pageNumber,
      content: r.chunk.content,
      score: r.score,
    }));

    return {
      chunks: filtered.map((r) => r.chunk),
      citations,
    };
  }

  async query(input: QueryInput): Promise<RagAnswer> {
    const start = Date.now();

    // 1. Retrieve relevant context
    const { chunks, citations } = await this.retrieveContext(
      input.question,
      input.documentIds,
      input.topK,
    );

    if (chunks.length === 0) {
      // No context found — answer from LLM knowledge or politely decline
      const fallbackMessages: ChatMessage[] = [
        {
          role: 'system',
          content:
            'You are an enterprise knowledge assistant. No relevant documents were found in the knowledge base for this question. Inform the user clearly.',
        },
        { role: 'user', content: input.question },
      ];

      const result = await this.llm.chat(fallbackMessages);
      return {
        answer: result.content,
        citations: [],
        sessionId: input.sessionId,
        model: result.model,
        latencyMs: Date.now() - start,
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
      };
    }

    // 2. Build context string with citations
    const contextStr = chunks
      .map(
        (c, i) =>
          `[${i + 1}] Source: ${c.metadata.originalName} (chunk ${c.chunkIndex})\n${c.content}`,
      )
      .join('\n\n');

    // 3. Build prompt with history
    const messages = buildRagPrompt(input.question, contextStr, input.chatHistory ?? []);

    // 4. Generate answer
    const result = await this.llm.chat(messages, { temperature: 0.3 });

    return {
      answer: result.content,
      citations,
      sessionId: input.sessionId,
      model: result.model,
      latencyMs: Date.now() - start,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
    };
  }
}
