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
import { ApiKeyCryptoService } from "../ai/api-key-crypto.service";

@Injectable()
export class ModelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apiKeyCrypto: ApiKeyCryptoService,
  ) {}

  async listSummaries() {
    const models = await this.prisma.client.model.findMany({
      where: { enabled: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        modelId: true,
        name: true,
        platform: true,
      },
    });
    return { models };
  }

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
        enabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return {
      models: models.map((m) => ({
        ...m,
        apiKey: this.apiKeyCrypto.mask(m.apiKey),
      })),
    };
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
    const created = await this.prisma.client.model.create({
      data: {
        modelId: dto.modelId,
        name: dto.name,
        platform: dto.platform,
        baseURL: dto.baseURL,
        apiKey: dto.apiKey ? this.apiKeyCrypto.encrypt(dto.apiKey) : "",
      },
    });
    return { ...created, apiKey: this.apiKeyCrypto.mask(created.apiKey) };
  }

  async updateModel(id: string, dto: UpdateModelDto) {
    const { apiKey, ...rest } = dto;
    const data: UpdateModelDto = { ...rest };
    if (apiKey && !apiKey.startsWith("***")) {
      data.apiKey = this.apiKeyCrypto.encrypt(apiKey);
    }

    const updated = await this.prisma.client.model.update({
      where: { id },
      data,
    });
    return { ...updated, apiKey: this.apiKeyCrypto.mask(updated.apiKey) };
  }

  async deleteModel(id: string) {
    await this.prisma.client.model.delete({ where: { id } });
    return { id };
  }
}
