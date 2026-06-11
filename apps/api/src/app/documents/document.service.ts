import * as fs from 'fs';
import * as path from 'path';

import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';

import { type RagService } from '../rag/rag.service';

import { type DocumentStore } from './document.store';
import { type DocumentMetadata } from './document.types';
import { type FsStorageAdapter } from './storage/fs-storage.adapter';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
]);

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx', '.xlsx', '.txt', '.csv']);

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(
    private readonly store: DocumentStore,
    private readonly storage: FsStorageAdapter,
    private readonly config: ConfigService,
    private readonly ragService: RagService,
  ) {}

  async upload(file: Express.Multer.File, owner: string): Promise<DocumentMetadata> {
    // Validate file type
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      await this.storage.deleteFile(file.path);
      throw new BadRequestException(
        `Unsupported file type: ${ext}. Allowed: ${Array.from(ALLOWED_EXTENSIONS).join(', ')}`,
      );
    }

    if (file.mimetype && !ALLOWED_MIME_TYPES.has(file.mimetype)) {
      await this.storage.deleteFile(file.path);
      throw new BadRequestException(`Invalid MIME type: ${file.mimetype}`);
    }

    // Validate size
    const maxMb = this.config.get<number>('upload.maxSizeMb') ?? 50;
    const maxBytes = maxMb * 1024 * 1024;
    if (file.size > maxBytes) {
      await this.storage.deleteFile(file.path);
      throw new BadRequestException(`File too large. Maximum size is ${maxMb}MB`);
    }

    const doc = this.store.create({
      filename: path.basename(file.path),
      originalName: file.originalname,
      mimeType: file.mimetype || `application/${ext.slice(1)}`,
      size: file.size,
      path: file.path,
      owner,
      status: 'uploaded',
    });

    this.logger.log(`Document uploaded: ${doc.id} (${doc.originalName}) by ${owner}`);

    // Trigger async RAG ingest (do not await — return immediately to client)
    this.triggerIngest(doc).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`RAG ingest failed for ${doc.id}: ${message}`);
      this.store.updateStatus(doc.id, 'error', { errorMessage: message });
    });

    return doc;
  }

  private async triggerIngest(doc: DocumentMetadata): Promise<void> {
    this.store.updateStatus(doc.id, 'parsing');
    this.logger.log(`Starting RAG ingest for: ${doc.id}`);

    const buffer = await fs.promises.readFile(doc.path);

    this.store.updateStatus(doc.id, 'embedding');

    const result = await this.ragService.pipeline.ingest({
      documentId: doc.id,
      filename: doc.filename,
      originalName: doc.originalName,
      mimeType: doc.mimeType,
      owner: doc.owner,
      buffer,
    });

    this.store.updateStatus(doc.id, 'indexed');
    this.store.updateChunkCount(doc.id, result.chunkCount, result.pageCount);

    this.logger.log(
      `RAG ingest complete: ${doc.id} — ${result.chunkCount} chunks, ${result.latencyMs}ms`,
    );
  }

  findAll(owner?: string): DocumentMetadata[] {
    if (owner) {
      return this.store.findByOwner(owner);
    }
    return this.store.findAll();
  }

  findById(id: string): DocumentMetadata {
    const doc = this.store.findById(id);
    if (!doc) throw new NotFoundException(`Document ${id} not found`);
    return doc;
  }

  async delete(id: string, owner: string): Promise<void> {
    const doc = this.findById(id);
    if (doc.owner !== owner) {
      throw new BadRequestException('You do not own this document');
    }

    // Remove physical file
    if (await this.storage.fileExists(doc.path)) {
      await this.storage.deleteFile(doc.path);
    }

    // Remove from vector store
    try {
      await this.ragService.vectorStore.deleteByDocumentId(id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to remove vectors for document ${id}: ${message}`);
    }

    this.store.delete(id);
    this.logger.log(`Document deleted: ${id} by ${owner}`);
  }

  getStats() {
    const all = this.store.findAll();
    const byStatus = all.reduce(
      (acc, doc) => {
        acc[doc.status] = (acc[doc.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      total: all.length,
      byStatus,
      totalSizeBytes: all.reduce((sum, d) => sum + d.size, 0),
    };
  }

  async readFile(id: string): Promise<Buffer> {
    const doc = this.findById(id);
    if (!(await this.storage.fileExists(doc.path))) {
      throw new NotFoundException(`File not found on disk for document ${id}`);
    }
    return fs.promises.readFile(doc.path);
  }
}
