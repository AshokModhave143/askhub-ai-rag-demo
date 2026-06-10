import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  port: parseInt(process.env['PORT'] ?? '3001', 10),
  logLevel: process.env['LOG_LEVEL'] ?? 'log',
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env['JWT_SECRET'] ?? '',
  expiresIn: process.env['JWT_EXPIRES_IN'] ?? '12h',
}));

export const ollamaConfig = registerAs('ollama', () => ({
  host: process.env['OLLAMA_HOST'] ?? 'http://localhost:11434',
  chatModel: process.env['OLLAMA_CHAT_MODEL'] ?? 'qwen3:4b',
  embedModel: process.env['OLLAMA_EMBED_MODEL'] ?? 'nomic-embed-text',
}));

export const qdrantConfig = registerAs('qdrant', () => ({
  url: process.env['QDRANT_URL'] ?? 'http://localhost:6333',
  apiKey: process.env['QDRANT_API_KEY'] ?? '',
  collection: process.env['QDRANT_COLLECTION'] ?? 'askhub_docs',
}));

export const uploadConfig = registerAs('upload', () => ({
  dir: process.env['UPLOAD_DIR'] ?? './uploads',
  maxSizeMb: parseInt(process.env['MAX_UPLOAD_MB'] ?? '50', 10),
}));

export const langfuseConfig = registerAs('langfuse', () => ({
  publicKey: process.env['LANGFUSE_PUBLIC_KEY'] ?? '',
  secretKey: process.env['LANGFUSE_SECRET_KEY'] ?? '',
  host: process.env['LANGFUSE_HOST'] ?? 'http://localhost:3100',
}));

export const otelConfig = registerAs('otel', () => ({
  endpoint: process.env['OTEL_EXPORTER_OTLP_ENDPOINT'] ?? 'http://localhost:4318',
  serviceName: process.env['OTEL_SERVICE_NAME'] ?? 'askhub-api',
}));
