/*
 * @Description: 
 * @Author: zhuzm
 * @Date: 2025-11-23 15:43:27
 * @LastEditors: zhuzm
 * @LastEditTime: 2025-11-23 15:54:45
 */
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateModelDto, UpdateModelDto } from "./dto";

@Injectable()
export class ModelsService {
  constructor(private readonly prisma: PrismaService) {}

  async listProviders() {
    const models = await this.prisma.client.model.findMany({ 
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        modelId: true,
        name: true,
        platform: true,
        baseURL: true,
        apiKey: true,
        createdAt: true,
        updatedAt: true
      }
    });
    return { models };
  }

  async getPreferredModel(userId: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: { preferredModel: true },
    });
    return user?.preferredModel ?? null;
  }

  async updatePreferredModel(userId: string, preferredModel: string | null) {
    await this.prisma.client.user.update({
      where: { id: userId },
      data: { preferredModel },
    });
    return preferredModel;
  }

  async createModel(dto: CreateModelDto) {
    return this.prisma.client.model.create({
      data: {
        modelId: dto.modelId,
        name: dto.name,
        platform: dto.platform,
        baseURL: dto.baseURL,
        apiKey: dto.apiKey,
      },
    });
  }

  async updateModel(id: string, dto: UpdateModelDto) {
    return this.prisma.client.model.update({
      where: { id },
      data: dto,
    });
  }

  async deleteModel(id: string) {
    await this.prisma.client.model.delete({ where: { id } });
    return { id };
  }
}