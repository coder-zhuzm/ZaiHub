/*
 * @Description: 
 * @Author: zhuzm
 * @Date: 2025-11-22 20:46:53
 * @LastEditors: zhuzm
 * @LastEditTime: 2025-11-22 20:58:05
 */
import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';
import { ApiKeyCryptoService } from './api-key-crypto.service';
import { ChatRunService } from './chat-run.service';
import { MessageMapper } from './message-mapper';
import { ModelResolver } from './model-resolver';
import { ProviderFactory } from './provider-factory';
import { SseWriter } from './sse-writer';

@Module({
  imports: [PassportModule],
  controllers: [AiController],
  providers: [
    ApiKeyCryptoService,
    ChatRunService,
    MessageMapper,
    ModelResolver,
    PrismaService,
    ProviderFactory,
    SseWriter,
  ],
  exports: [ApiKeyCryptoService, ModelResolver],
})
export class AiModule {}
