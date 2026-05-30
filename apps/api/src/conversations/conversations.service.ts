import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateConversationDto, UpdateConversationDto } from "./dto";

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const conversations = await this.prisma.client.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, createdAt: true },
        },
        _count: { select: { messages: true, runs: true } },
      },
    });

    return {
      conversations: conversations.map((conversation) => ({
        id: conversation.id,
        title: conversation.title || conversation.messages[0]?.content?.slice(0, 80) || "新会话",
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        lastMessage: conversation.messages[0]?.content ?? "",
        messageCount: conversation._count.messages,
        runCount: conversation._count.runs,
      })),
    };
  }

  async get(userId: string, id: string) {
    const conversation = await this.prisma.client.conversation.findFirst({
      where: { id, userId },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        runs: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!conversation) throw new NotFoundException("conversation_not_found");
    return { conversation };
  }

  async create(userId: string, dto: CreateConversationDto) {
    const conversation = await this.prisma.client.conversation.create({
      data: {
        userId,
        title: dto.title?.trim() || "新会话",
      },
    });
    return { conversation };
  }

  async update(userId: string, id: string, dto: UpdateConversationDto) {
    await this.ensureOwned(userId, id);
    const conversation = await this.prisma.client.conversation.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() || "新会话" } : {}),
      },
    });
    return { conversation };
  }

  async delete(userId: string, id: string) {
    await this.ensureOwned(userId, id);
    await this.prisma.client.conversation.delete({ where: { id } });
    return { id };
  }

  private async ensureOwned(userId: string, id: string) {
    const conversation = await this.prisma.client.conversation.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!conversation) throw new NotFoundException("conversation_not_found");
  }
}
