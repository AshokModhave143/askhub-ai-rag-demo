import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api',
  timeout: 300_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT from localStorage on every request
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

// Global 401 handler — clear token and redirect to login
apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      typeof window !== 'undefined'
    ) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// ─── Auth API ─────────────────────────────────────────────────────────────────

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  accessToken: string;
  expiresIn: string;
  user: { id: string; email: string; name: string; role: string };
}

export const authApi = {
  login: (payload: LoginPayload) =>
    apiClient.post<AuthResponse>('/auth/login', payload).then((r) => r.data),

  register: (payload: RegisterPayload) =>
    apiClient.post<AuthResponse>('/auth/register', payload).then((r) => r.data),

  me: () =>
    apiClient
      .get<{ id: string; email: string; name: string; role: string }>('/auth/me')
      .then((r) => r.data),
};

// ─── Documents API ────────────────────────────────────────────────────────────

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

export interface DocumentStats {
  total: number;
  byStatus: Record<string, number>;
  totalSizeBytes: number;
}

export const documentsApi = {
  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient
      .post<DocumentDto>('/documents/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  list: () => apiClient.get<DocumentDto[]>('/documents').then((r) => r.data),

  get: (id: string) => apiClient.get<DocumentDto>(`/documents/${id}`).then((r) => r.data),

  delete: (id: string) => apiClient.delete(`/documents/${id}`),

  stats: () => apiClient.get<DocumentStats>('/documents/stats').then((r) => r.data),
};

// ─── Chat API ─────────────────────────────────────────────────────────────────

export interface Citation {
  documentId: string;
  filename: string;
  chunkIndex: number;
  pageNumber?: number;
  content: string;
  score: number;
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

export interface ChatSession extends ChatSessionDto {
  messages: ChatMessageDto[];
}

export interface SendMessageResponse {
  sessionId: string;
  messageId: string;
  answer: string;
  citations: Citation[];
  timestamp: string;
}

export const chatApi = {
  sendMessage: (payload: { message: string; sessionId?: string; documentIds?: string[] }) =>
    apiClient.post<SendMessageResponse>('/chat/message', payload).then((r) => r.data),

  getSessions: () => apiClient.get<ChatSessionDto[]>('/chat/sessions').then((r) => r.data),

  getSession: (id: string) =>
    apiClient.get<ChatSession>(`/chat/sessions/${id}`).then((r) => r.data),

  deleteSession: (id: string) => apiClient.delete(`/chat/sessions/${id}`),
};

// ─── Health API ───────────────────────────────────────────────────────────────

export const healthApi = {
  check: () => apiClient.get<{ status: string }>('/health').then((r) => r.data),
};
