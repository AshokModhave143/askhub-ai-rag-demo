import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';

import { type DocumentMetadata, type DocumentStatus } from './document.types.js';

/**
 * In-memory document registry.
 * Replace with a database repository in production.
 */
@Injectable()
export class DocumentStore {
  private readonly docs = new Map<string, DocumentMetadata>();

  create(data: Omit<DocumentMetadata, 'id' | 'uploadedAt' | 'updatedAt'>): DocumentMetadata {
    const doc: DocumentMetadata = {
      ...data,
      id: randomUUID(),
      uploadedAt: new Date(),
      updatedAt: new Date(),
    };
    this.docs.set(doc.id, doc);
    return doc;
  }

  findById(id: string): DocumentMetadata | undefined {
    return this.docs.get(id);
  }

  findByOwner(owner: string): DocumentMetadata[] {
    return Array.from(this.docs.values()).filter((d) => d.owner === owner);
  }

  findAll(): DocumentMetadata[] {
    return Array.from(this.docs.values());
  }

  updateStatus(
    id: string,
    status: DocumentStatus,
    extra?: Partial<DocumentMetadata>,
  ): DocumentMetadata | undefined {
    const doc = this.docs.get(id);
    if (!doc) return undefined;
    const updated = { ...doc, ...extra, status, updatedAt: new Date() };
    this.docs.set(id, updated);
    return updated;
  }

  updateChunkCount(
    id: string,
    chunkCount: number,
    pageCount?: number,
  ): DocumentMetadata | undefined {
    const doc = this.docs.get(id);
    if (!doc) return undefined;
    const updated = { ...doc, chunkCount, pageCount, updatedAt: new Date() };
    this.docs.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.docs.delete(id);
  }

  count(): number {
    return this.docs.size;
  }
}
