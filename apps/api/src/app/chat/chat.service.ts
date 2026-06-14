import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { RagService } from '../rag/rag.service';

import { ChatSessionStore } from './chat.store';

import type { SendMessageDto } from './dto/send-message.dto';
import type { ChatSession, ConversationMessage } from '@askhub-ai-rag-demo/core-domain';
import type { ChatMessage } from '@askhub-ai-rag-demo/core-ports';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly ragService: RagService,
    private readonly sessionStore: ChatSessionStore,
  ) {}

  async sendMessage(
    dto: SendMessageDto,
    userId: string,
  ): Promise<{ session: ChatSession; answer: ConversationMessage }> {
    // Resolve or create session
    let session: ChatSession;
    if (dto.sessionId) {
      const existing = this.sessionStore.findById(dto.sessionId);
      if (!existing) {
        throw new NotFoundException(`Session ${dto.sessionId} not found`);
      }
      session = existing;
    } else {
      session = this.sessionStore.create(userId, undefined, dto.documentIds);
    }

    // Add user message to session
    const userMessage: ConversationMessage = {
      id: uuidv4(),
      role: 'user',
      content: dto.message,
      timestamp: new Date(),
    };
    this.sessionStore.addMessage(session.id, userMessage);

    // Build chat history for context
    const chatHistory: ChatMessage[] = session.messages
      .filter((m) => m.role !== 'system')
      .slice(-10) // last 5 exchanges
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    this.logger.log(
      `RAG query — session: ${session.id}, user: ${userId}, question: "${dto.message.slice(
        0,
        80,
      )}"`,
    );

    // Run RAG pipeline
    const ragAnswer = await this.ragService.pipeline.query({
      question: dto.message,
      sessionId: session.id,
      documentIds: dto.documentIds ?? session.documentIds,
      chatHistory,
    });

    this.logger.log(
      `RAG answer — ${ragAnswer.citations.length} citations, ${ragAnswer.latencyMs}ms, model: ${ragAnswer.model}`,
    );

    // Add assistant message
    const assistantMessage: ConversationMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: ragAnswer.answer,
      citations: ragAnswer.citations,
      timestamp: new Date(),
    };
    const updatedSession = this.sessionStore.addMessage(session.id, assistantMessage);

    return { session: updatedSession, answer: assistantMessage };
  }

  getSessions(userId: string): ChatSession[] {
    return this.sessionStore.findByUser(userId);
  }

  getSession(sessionId: string, userId: string): ChatSession {
    const session = this.sessionStore.findById(sessionId);
    if (!session || session.userId !== userId) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }
    return session;
  }

  deleteSession(sessionId: string, userId: string): void {
    const deleted = this.sessionStore.delete(sessionId, userId);
    if (!deleted) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }
  }
}
