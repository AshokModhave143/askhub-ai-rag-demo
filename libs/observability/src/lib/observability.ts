import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { Langfuse } from 'langfuse';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ObservabilityConfig {
  otel: {
    endpoint: string;
    serviceName: string;
  };
  langfuse: {
    publicKey: string;
    secretKey: string;
    host: string;
  };
}

export interface LlmTraceInput {
  name: string;
  userId?: string;
  sessionId?: string;
  input: unknown;
  output: unknown;
  model?: string;
  latencyMs?: number;
  promptTokens?: number;
  completionTokens?: number;
  metadata?: Record<string, unknown>;
}

// ─── OTEL Tracing Bootstrap ───────────────────────────────────────────────────

let sdkInstance: NodeSDK | null = null;

export function initTracing(config: ObservabilityConfig): void {
  if (sdkInstance) return; // already initialized

  // Service name is picked up from OTEL_SERVICE_NAME env var.
  process.env.OTEL_SERVICE_NAME = config.otel.serviceName;

  const exporter = new OTLPTraceExporter({
    url: `${config.otel.endpoint}/v1/traces`,
  });

  sdkInstance = new NodeSDK({
    traceExporter: exporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });

  sdkInstance.start();
}

export async function shutdownTracing(): Promise<void> {
  if (sdkInstance) {
    await sdkInstance.shutdown();
    sdkInstance = null;
  }
}

// ─── Langfuse LLM Observability ───────────────────────────────────────────────

let langfuseInstance: Langfuse | null = null;

export function getLangfuse(config: ObservabilityConfig): Langfuse {
  if (!langfuseInstance) {
    langfuseInstance = new Langfuse({
      publicKey: config.langfuse.publicKey,
      secretKey: config.langfuse.secretKey,
      baseUrl: config.langfuse.host,
    });
  }
  return langfuseInstance;
}

export async function traceLlmCall(langfuse: Langfuse, input: LlmTraceInput): Promise<void> {
  const trace = langfuse.trace({
    name: input.name,
    userId: input.userId,
    sessionId: input.sessionId,
    metadata: input.metadata,
  });

  trace.generation({
    name: input.name,
    model: input.model ?? 'unknown',
    input: input.input,
    output: input.output,
    usage: {
      promptTokens: input.promptTokens ?? 0,
      completionTokens: input.completionTokens ?? 0,
      totalTokens: (input.promptTokens ?? 0) + (input.completionTokens ?? 0),
    },
    metadata: {
      latencyMs: input.latencyMs,
    },
  });

  await langfuse.flushAsync();
}
