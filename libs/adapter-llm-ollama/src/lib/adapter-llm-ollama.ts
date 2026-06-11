import type {
  ILlmAdapter,
  ChatMessage,
  ChatCompletionOptions,
  ChatCompletionResult,
  EmbeddingResult,
} from '@askhub-ai-rag-demo/core-ports';

interface OllamaChatRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  stream: boolean;
  // Disable reasoning on Ollama >= 0.9 (ignored by older builds, which still
  // emit a <think>...</think> block we strip below).
  think?: boolean;
  options?: {
    temperature?: number;
    num_predict?: number;
  };
}

/**
 * Reasoning models (e.g. qwen3) wrap their chain-of-thought in <think>...</think>
 * before the actual answer. Older Ollama builds ignore `think: false`, so strip
 * the reasoning here to return only the final answer.
 */
function stripThinking(content: string): string {
  // Remove well-formed <think>...</think> blocks.
  let out = content.replace(/<think>[\s\S]*?<\/think>/gi, '');
  // Reasoning emitted without an opening tag: keep only text after the last </think>.
  const close = out.toLowerCase().lastIndexOf('</think>');
  if (close !== -1) out = out.slice(close + '</think>'.length);
  // Truncated mid-reasoning (no closing tag): drop everything from <think> on.
  const open = out.toLowerCase().indexOf('<think>');
  if (open !== -1) out = out.slice(0, open);
  return out.trim();
}

interface OllamaChatResponse {
  model: string;
  message: { role: string; content: string };
  done: boolean;
  prompt_eval_count?: number;
  eval_count?: number;
}

interface OllamaEmbedRequest {
  model: string;
  input: string;
}

interface OllamaEmbedResponse {
  model: string;
  embeddings: number[][];
}

export interface OllamaAdapterConfig {
  host: string;
  chatModel: string;
  embedModel: string;
  timeoutMs?: number;
}

export class OllamaAdapter implements ILlmAdapter {
  private readonly host: string;
  private readonly defaultChatModel: string;
  private readonly defaultEmbedModel: string;
  private readonly timeoutMs: number;

  constructor(config: OllamaAdapterConfig) {
    this.host = config.host.replace(/\/$/, '');
    this.defaultChatModel = config.chatModel;
    this.defaultEmbedModel = config.embedModel;
    this.timeoutMs = config.timeoutMs ?? 300_000;
  }

  async chat(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {},
  ): Promise<ChatCompletionResult> {
    const start = Date.now();

    const body: OllamaChatRequest = {
      model: options.model ?? this.defaultChatModel,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: false,
      think: false,
      options: {
        temperature: options.temperature ?? 0.3,
        ...(options.maxTokens ? { num_predict: options.maxTokens } : {}),
      },
    };

    const response = await this.fetch<OllamaChatResponse>('/api/chat', 'POST', body);

    return {
      content: stripThinking(response.message.content),
      model: response.model,
      promptTokens: response.prompt_eval_count,
      completionTokens: response.eval_count,
      latencyMs: Date.now() - start,
    };
  }

  async embed(text: string, model?: string): Promise<EmbeddingResult> {
    const start = Date.now();

    const body: OllamaEmbedRequest = {
      model: model ?? this.defaultEmbedModel,
      input: text,
    };

    const response = await this.fetch<OllamaEmbedResponse>('/api/embed', 'POST', body);

    const embedding = response.embeddings[0];
    if (!embedding) {
      throw new Error('Ollama returned empty embeddings array');
    }

    return {
      embedding,
      model: response.model,
      latencyMs: Date.now() - start,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.host}/api/tags`, {
        signal: AbortSignal.timeout(5_000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async fetch<T>(path: string, method: 'GET' | 'POST', body?: unknown): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.host}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'unknown error');
        throw new Error(`Ollama API error ${response.status}: ${errorText}`);
      }

      return response.json() as Promise<T>;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
