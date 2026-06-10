export interface AppConfig {
  nodeEnv: string;
  port: number;
  logLevel: string;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export interface OllamaConfig {
  host: string;
  chatModel: string;
  embedModel: string;
}

export interface QdrantConfig {
  url: string;
  apiKey: string;
  collection: string;
}

export interface UploadConfig {
  dir: string;
  maxSizeMb: number;
}

export interface LangfuseConfig {
  publicKey: string;
  secretKey: string;
  host: string;
}

export interface OtelConfig {
  endpoint: string;
  serviceName: string;
}

export interface FullConfig {
  app: AppConfig;
  jwt: JwtConfig;
  ollama: OllamaConfig;
  qdrant: QdrantConfig;
  upload: UploadConfig;
  langfuse: LangfuseConfig;
  otel: OtelConfig;
}
