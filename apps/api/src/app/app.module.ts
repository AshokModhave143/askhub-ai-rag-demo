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

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';

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
    HealthModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
