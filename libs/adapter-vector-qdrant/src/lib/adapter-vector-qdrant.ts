import { QdrantClient } from '@qdrant/js-client-rest';

import type { DocumentChunk } from '@askhub-ai-rag-demo/core-domain';
import type {
  IVectorStore,
  VectorSearchOptions,
  VectorSearchResult,
} from '@askhub-ai-rag-demo/core-ports';

export interface QdrantAdapterConfig {
  url: string;
  apiKey?: string;
  collection: string;
}

interface QdrantPayload {
  documentId: string;
  content: string;
  chunkIndex: number;
  pageNumber?: number;
  filename: string;
  originalName: string;
  owner: string;
  source: string;
}

export class QdrantVectorStore implements IVectorStore {
  private readonly client: QdrantClient;
  private readonly collection: string;
  private collectionReady = false;

  constructor(config: QdrantAdapterConfig) {
    this.collection = config.collection;
    this.client = new QdrantClient({
      url: config.url,
      ...(config.apiKey ? { apiKey: config.apiKey } : {}),
    });
  }

  async ensureCollection(vectorSize: number): Promise<void> {
    if (this.collectionReady) return;

    const existing = await this.client.getCollections();
    const exists = existing.collections.some((c) => c.name === this.collection);

    if (!exists) {
      await this.client.createCollection(this.collection, {
        vectors: {
          size: vectorSize,
          distance: 'Cosine',
        },
        optimizers_config: {
          default_segment_number: 2,
        },
        replication_factor: 1,
      });

      // Create payload indices for filtering
      await this.client.createPayloadIndex(this.collection, {
        field_name: 'documentId',
        field_schema: 'keyword',
      });
      await this.client.createPayloadIndex(this.collection, {
        field_name: 'owner',
        field_schema: 'keyword',
      });
    }

    this.collectionReady = true;
  }

  async upsert(chunks: DocumentChunk[]): Promise<void> {
    if (chunks.length === 0) return;

    const points = chunks.map((chunk) => {
      if (!chunk.embedding) {
        throw new Error(`Chunk ${chunk.id} missing embedding — embed before upserting`);
      }
      const payload: QdrantPayload = {
        documentId: chunk.documentId,
        content: chunk.content,
        chunkIndex: chunk.chunkIndex,
        pageNumber: chunk.pageNumber,
        filename: chunk.metadata.filename,
        originalName: chunk.metadata.originalName,
        owner: chunk.metadata.owner,
        source: chunk.metadata.source,
      };
      return {
        id: chunk.id,
        vector: chunk.embedding,
        payload: payload as unknown as Record<string, unknown>,
      };
    });

    // Batch upsert in chunks of 100
    const batchSize = 100;
    for (let i = 0; i < points.length; i += batchSize) {
      const batch = points.slice(i, i + batchSize);
      await this.client.upsert(this.collection, {
        wait: true,
        points: batch,
      });
    }
  }

  async search(
    embedding: number[],
    options: VectorSearchOptions = {},
  ): Promise<VectorSearchResult[]> {
    const { topK = 5, scoreThreshold = 0.3, filter } = options;

    const qdrantFilter = this.buildFilter(filter);

    const results = await this.client.search(this.collection, {
      vector: embedding,
      limit: topK,
      score_threshold: scoreThreshold,
      with_payload: true,
      ...(qdrantFilter ? { filter: qdrantFilter } : {}),
    });

    return results.map((r) => {
      const p = r.payload as unknown as QdrantPayload;
      const chunk: DocumentChunk = {
        id: String(r.id),
        documentId: p.documentId,
        content: p.content,
        chunkIndex: p.chunkIndex,
        pageNumber: p.pageNumber,
        metadata: {
          filename: p.filename,
          originalName: p.originalName,
          owner: p.owner,
          source: p.source,
        },
      };
      return { chunk, score: r.score };
    });
  }

  async deleteByDocumentId(documentId: string): Promise<void> {
    await this.client.delete(this.collection, {
      wait: true,
      filter: {
        must: [
          {
            key: 'documentId',
            match: { value: documentId },
          },
        ],
      },
    });
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.getCollections();
      return true;
    } catch {
      return false;
    }
  }

  private buildFilter(filter?: Record<string, unknown>): Record<string, unknown> | null {
    if (!filter || Object.keys(filter).length === 0) return null;

    const must = Object.entries(filter).map(([key, value]) => ({
      key,
      match: { value },
    }));

    return { must };
  }
}
