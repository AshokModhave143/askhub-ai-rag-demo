import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly config: ConfigService) {}

  private async ping(
    name: string,
    url: string,
  ): Promise<{ name: string; status: 'up' | 'down'; message?: string }> {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 3000);
      await fetch(url, { signal: ctrl.signal });
      clearTimeout(t);
      return { name, status: 'up' };
    } catch {
      return { name, status: 'down', message: 'unreachable' };
    }
  }

  @Get()
  @ApiOperation({ summary: 'Health check with external services' })
  async check() {
    const ollamaHost = this.config.get<string>('ollama.host');
    const qdrantUrl = this.config.get<string>('qdrant.url');

    const [ollama, qdrant] = await Promise.all([
      this.ping('ollama', `${ollamaHost}/api/version`),
      this.ping('qdrant', `${qdrantUrl}/healthz`),
    ]);

    const allUp = ollama.status === 'up' && qdrant.status === 'up';

    return {
      status: allUp ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: { ollama, qdrant },
    };
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
