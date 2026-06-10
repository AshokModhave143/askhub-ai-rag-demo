import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3001),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'log', 'debug', 'verbose').default('log'),

  // JWT
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('12h'),

  // Ollama
  OLLAMA_HOST: Joi.string().uri().default('http://localhost:11434'),

  // Qdrant
  QDRANT_URL: Joi.string().uri().default('http://localhost:6333'),
  QDRANT_API_KEY: Joi.string().allow('').default(''),
  QDRANT_COLLECTION: Joi.string().default('askhub_docs'),

  // Upload
  UPLOAD_DIR: Joi.string().default('./uploads'),
  MAX_UPLOAD_MB: Joi.number().default(50),

  // Langfuse (optional for dev)
  LANGFUSE_PUBLIC_KEY: Joi.string().allow('').default(''),
  LANGFUSE_SECRET_KEY: Joi.string().allow('').default(''),
  LANGFUSE_HOST: Joi.string().uri().default('http://localhost:3100'),

  // OTEL (optional)
  OTEL_EXPORTER_OTLP_ENDPOINT: Joi.string().uri().default('http://localhost:4318'),
  OTEL_SERVICE_NAME: Joi.string().default('askhub-api'),
});
