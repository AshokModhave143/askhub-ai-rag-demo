import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import type { ChatSession, ConversationMessage } from '@askhub-ai-rag-demo/core-domain';

@Injectable()
export class ChatSessionStore {
  private readonly sessions = new Map<string, ChatSession>();

  create(userId: string, title?: string, documentIds?: string[]): ChatSession {
    const session: ChatSession = {
      id: uuidv4(),
      userId,
      title: title ?? 'New Conversation',
      messages: [],
      documentIds: documentIds ?? [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.sessions.set(session.id, session);
    return session;
  }

  findById(id: string): ChatSession | undefined {
    return this.sessions.get(id);
  }

  findByUser(userId: string): ChatSession[] {
    return Array.from(this.sessions.values())
      .filter((s) => s.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  addMessage(sessionId: string, message: ConversationMessage): ChatSession {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    session.messages.push(message);
    session.updatedAt = new Date();

    // Auto-title from first user message
    if (session.messages.length === 2 && session.title === 'New Conversation') {
      const firstUserMsg = session.messages.find((m) => m.role === 'user');
      if (firstUserMsg) {
        session.title =
          firstUserMsg.content.slice(0, 60) + (firstUserMsg.content.length > 60 ? '...' : '');
      }
    }

    this.sessions.set(sessionId, session);
    return session;
  }

  delete(sessionId: string, userId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || session.userId !== userId) return false;
    return this.sessions.delete(sessionId);
  }

  count(): number {
    return this.sessions.size;
  }
}
