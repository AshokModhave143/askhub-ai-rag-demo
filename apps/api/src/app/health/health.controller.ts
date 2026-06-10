import { Controller, Get } from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  type HealthCheckService,
  type HealthCheckResult,
  type HealthIndicatorResult,
} from '@nestjs/terminus';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly config: ConfigService,
  ) {}

  private async pingUrl(name: string, url: string): Promise<HealthIndicatorResult> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok || res.status < 500) {
        return { [name]: { status: 'up' } };
      }
      return { [name]: { status: 'down', message: `HTTP ${res.status}` } };
    } catch {
      return { [name]: { status: 'down', message: 'unreachable' } };
    }
  }

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Health check' })
  check(): Promise<HealthCheckResult> {
    const ollamaHost = this.config.get<string>('ollama.host');
    const qdrantUrl = this.config.get<string>('qdrant.url');

    return this.health.check([
      () => this.pingUrl('ollama', `${ollamaHost}/api/version`),
      () => this.pingUrl('qdrant', `${qdrantUrl}/healthz`),
    ]);
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  live() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  ready() {
    return { status: 'ready', timestamp: new Date().toISOString() };
  }
}
