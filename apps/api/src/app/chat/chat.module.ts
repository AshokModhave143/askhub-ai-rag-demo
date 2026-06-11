import { Module } from '@nestjs/common';

import { RagModule } from '../rag/rag.module';

import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatSessionStore } from './chat.store';

@Module({
  imports: [RagModule],
  controllers: [ChatController],
  providers: [ChatService, ChatSessionStore],
  exports: [ChatService, ChatSessionStore],
})
export class ChatModule {}
