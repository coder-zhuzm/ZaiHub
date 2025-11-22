import { Injectable } from '@nestjs/common';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiService {
  constructor(private prisma: PrismaService) {}

  async chat(messages: any[], userId: string) {
    // 保存聊天记录
    if (this.prisma.isAvailable()) {
      await this.prisma.client.chat.create({
        data: {
          userId,
          messages,
        },
      });
    }

    // 调用AI
    const result = streamText({
      model: openai('gpt-3.5-turbo'),
      messages,
    });

    return result;
  }
}