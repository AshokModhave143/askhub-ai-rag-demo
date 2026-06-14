import { OllamaAdapter } from '@askhub-ai-rag-demo/adapter-llm-ollama';
import { QdrantVectorStore } from '@askhub-ai-rag-demo/adapter-vector-qdrant';
import { RagPipeline, DocumentParserService } from '@askhub-ai-rag-demo/rag-pipeline';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RagService {
  public readonly llmAdapter: OllamaAdapter;
  public readonly vectorStore: QdrantVectorStore;
  public readonly pipeline: RagPipeline;
  public readonly parser: DocumentParserService;

  constructor(private readonly config: ConfigService) {
    this.llmAdapter = new OllamaAdapter({
      host: this.config.get<string>('ollama.host') ?? 'http://localhost:11434',
      chatModel: this.config.get<string>('ollama.chatModel') ?? 'qwen3:4b',
      embedModel: this.config.get<string>('ollama.embedModel') ?? 'nomic-embed-text',
      timeoutMs: 300_000,
    });

    this.vectorStore = new QdrantVectorStore({
      url: this.config.get<string>('qdrant.url') ?? 'http://localhost:6333',
      apiKey: this.config.get<string>('qdrant.apiKey') || undefined,
      collection: this.config.get<string>('qdrant.collection') ?? 'askhub_docs',
    });

    this.parser = new DocumentParserService();

    this.pipeline = new RagPipeline(this.llmAdapter, this.vectorStore, this.parser);
  }
}
