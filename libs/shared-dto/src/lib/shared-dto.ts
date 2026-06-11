import type { Citation } from '@askhub-ai-rag-demo/core-domain';

// ─── Chat DTOs ───────────────────────────────────────────────────────────────

export interface SendMessageDto {
  message: string;
  sessionId?: string;
  documentIds?: string[];
}

export interface ChatMessageDto {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Citation[];
  timestamp: string;
}

export interface ChatSessionDto {
  id: string;
  title: string;
  userId: string;
  messageCount: number;
  documentIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatResponseDto {
  sessionId: string;
  messageId: string;
  answer: string;
  citations: Citation[];
  model: string;
  latencyMs: number;
}

// ─── Document DTOs ────────────────────────────────────────────────────────────

export interface DocumentDto {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  status: string;
  chunkCount?: number;
  pageCount?: number;
  errorMessage?: string;
  owner: string;
  uploadedAt: string;
  updatedAt: string;
}

export interface DocumentStatsDto {
  total: number;
  byStatus: Record<string, number>;
  totalSizeBytes: number;
}

// ─── Auth DTOs ────────────────────────────────────────────────────────────────

export interface UserProfileDto {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthResponseDto {
  accessToken: string;
  expiresIn: string;
  user: UserProfileDto;
}
