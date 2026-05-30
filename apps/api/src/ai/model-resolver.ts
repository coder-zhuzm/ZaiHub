import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ApiKeyCryptoService } from "./api-key-crypto.service";
import type { ResolvedModelConfig } from "./types";

@Injectable()
export class ModelResolver {
  private readonly modelCache = new Map<string, ResolvedModelConfig & { expires: number }>();
  private readonly MODEL_TTL_MS = 60_000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly apiKeyCrypto: ApiKeyCryptoService,
  ) {}

  async resolve(modelId: string | undefined): Promise<ResolvedModelConfig> {
    const defaults = this.getDefaults();
    if (!modelId) return defaults;

    const now = Date.now();
    const cached = this.modelCache.get(modelId);
    if (cached && cached.expires > now) {
      return cached;
    }

    const model = await this.prisma.client.model.findUnique({ where: { id: modelId } });
    if (!model) throw new Error("Model configuration not found");
    if (model.enabled === false) throw new Error("Model is disabled");

    const resolved = {
      id: model.id,
      modelName: model.modelId || defaults.modelName,
      baseURL: model.baseURL || defaults.baseURL,
      apiKey: model.apiKey ? this.apiKeyCrypto.decrypt(model.apiKey) : defaults.apiKey,
      platform: model.platform || defaults.platform,
    };

    if (!resolved.modelName || !resolved.baseURL || !resolved.apiKey) {
      throw new Error("Model configuration is incomplete");
    }

    this.modelCache.set(modelId, {
      ...resolved,
      expires: now + this.MODEL_TTL_MS,
    });

    return resolved;
  }

  clear(modelId: string) {
    this.modelCache.delete(modelId);
  }

  private getDefaults(): ResolvedModelConfig {
    return {
      baseURL: process.env.IFLOW_BASE_URL ?? "https://apis.iflow.cn/v1",
      apiKey: process.env.IFLOW_API_KEY ?? "",
      modelName: "qwen3-max",
      platform: "openai",
    };
  }
}
