import {
  envValidationSchema,
  appConfig,
  jwtConfig,
  ollamaConfig,
  qdrantConfig,
  uploadConfig,
  langfuseConfig,
  otelConfig,
} from '@askhub-ai-rag-demo/shared-config';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: { allowUnknown: true, abortEarly: false },
      load: [
        appConfig,
        jwtConfig,
        ollamaConfig,
        qdrantConfig,
        uploadConfig,
        langfuseConfig,
        otelConfig,
      ],
    }),
    TerminusModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
