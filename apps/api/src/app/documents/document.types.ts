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
