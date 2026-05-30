import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ChatRunService {
  constructor(private readonly prisma: PrismaService) {}

  async start(params: {
    userId: string;
    modelDbId?: string;
    conversationId?: string;
    userContent: string;
  }) {
    try {
      const conversation = await this.resolveConversation(params);
      const userMessage = await this.prisma.client.message.create({
        data: {
          conversationId: conversation.id,
          role: "user",
          content: params.userContent,
        },
      });
      const run = await this.prisma.client.chatRun.create({
        data: {
          conversationId: conversation.id,
          userMessageId: userMessage.id,
          modelDbId: params.modelDbId ?? null,
          status: "running",
        },
      });

      return { conversation, userMessage, run };
    } catch (error) {
      console.warn("Chat run persistence unavailable:", error);
      return null;
    }
  }

  private async resolveConversation(params: {
    userId: string;
    conversationId?: string;
    userContent: string;
  }) {
    if (params.conversationId) {
      return this.prisma.client.conversation.update({
        where: { id: params.conversationId, userId: params.userId },
        data: { updatedAt: new Date() },
      });
    }

    const recentEmptyConversation = await this.prisma.client.conversation.findFirst({
      where: {
        userId: params.userId,
        createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
        messages: { none: {} },
      },
      orderBy: { createdAt: "desc" },
    });

    if (recentEmptyConversation) {
      return this.prisma.client.conversation.update({
        where: { id: recentEmptyConversation.id },
        data: {
          title: params.userContent.slice(0, 80) || recentEmptyConversation.title,
          updatedAt: new Date(),
        },
      });
    }

    return this.prisma.client.conversation.create({
      data: {
        userId: params.userId,
        title: params.userContent.slice(0, 80) || null,
      },
    });
  }

  async finish(params: {
    runId?: string;
    conversationId?: string;
    modelDbId?: string;
    content: string;
    elapsedMs: number;
  }) {
    if (!params.runId || !params.conversationId) return;

    try {
      const assistantMessage = await this.prisma.client.message.create({
        data: {
          conversationId: params.conversationId,
          modelDbId: params.modelDbId ?? null,
          runId: params.runId,
          role: "assistant",
          content: params.content,
        },
      });
      await this.prisma.client.chatRun.update({
        where: { id: params.runId },
        data: {
          assistantMessageId: assistantMessage.id,
          status: "succeeded",
          elapsedMs: params.elapsedMs,
          completedAt: new Date(),
        },
      });
      await this.prisma.client.conversation.update({
        where: { id: params.conversationId },
        data: { updatedAt: new Date() },
      });
    } catch (error) {
      console.warn("Chat run finish persistence failed:", error);
    }
  }

  async fail(params: {
    runId?: string;
    conversationId?: string;
    errorMessage: string;
    elapsedMs: number;
  }) {
    if (!params.runId) return;
    try {
      await this.prisma.client.chatRun.update({
        where: { id: params.runId },
        data: {
          status: "failed",
          errorMessage: params.errorMessage,
          elapsedMs: params.elapsedMs,
          completedAt: new Date(),
        },
      });
      if (params.conversationId) {
        await this.prisma.client.conversation.update({
          where: { id: params.conversationId },
          data: { updatedAt: new Date() },
        });
      }
    } catch (error) {
      console.warn("Chat run failure persistence failed:", error);
    }
  }
}
