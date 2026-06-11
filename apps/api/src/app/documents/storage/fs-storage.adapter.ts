import * as fs from 'fs';
import * as path from 'path';

import { Injectable, Logger } from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';

import { type DocumentMetadata } from '../document.types';

/**
 * Filesystem-based storage adapter for uploaded documents.
 * Implements the storage port - can be replaced with Azure Blob adapter.
 */
@Injectable()
export class FsStorageAdapter {
  private readonly logger = new Logger(FsStorageAdapter.name);
  private readonly uploadDir: string;

  constructor(config: ConfigService) {
    this.uploadDir = path.resolve(config.get<string>('upload.dir') ?? './uploads');
    this.ensureDir(this.uploadDir);
  }

  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      this.logger.log(`Created upload directory: ${dir}`);
    }
  }

  getUploadDir(): string {
    return this.uploadDir;
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.promises.unlink(filePath);
    } catch (err) {
      this.logger.warn(`Failed to delete file ${filePath}: ${err}`);
    }
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  buildFilePath(documentId: string, filename: string): string {
    const ext = path.extname(filename);
    return path.join(this.uploadDir, `${documentId}${ext}`);
  }

  getDocumentSubDir(metadata: DocumentMetadata): string {
    return path.join(this.uploadDir, metadata.owner);
  }
}
