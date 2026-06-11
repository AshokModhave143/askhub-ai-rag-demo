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
import { ChatModule } from './chat/chat.module';
import { DocumentModule } from './documents/document.module';
import { HealthModule } from './health/health.module';
import { RagModule } from './rag/rag.module';

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
    RagModule,
    DocumentModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
