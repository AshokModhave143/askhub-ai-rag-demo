import { Module } from '@nestjs/common';

import { RagModule } from '../rag/rag.module';

import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { DocumentStore } from './document.store';
import { FsStorageAdapter } from './storage/fs-storage.adapter';

@Module({
  imports: [RagModule],
  controllers: [DocumentController],
  providers: [DocumentService, DocumentStore, FsStorageAdapter],
  exports: [DocumentService, DocumentStore, FsStorageAdapter],
})
export class DocumentModule {}
