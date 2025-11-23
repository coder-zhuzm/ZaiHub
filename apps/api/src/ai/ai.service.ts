/*
 * @Description:
 * @Author: zhuzm
 * @Date: 2025-11-22 20:46:58
 * @LastEditors: zhuzm
 * @LastEditTime: 2025-11-23 22:55:38
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { createOpenAI } from '@ai-sdk/openai';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private readonly modelCache = new Map<string, { 
    modelName?: string; 
    base?: string; 
    key?: string; 
    platform?: string; 
    provider: any;
    expires: number 
  }>();
  private readonly MODEL_TTL_MS = 60_000;

  constructor(private readonly config: ConfigService, private readonly prisma: PrismaService) {}

  async resolveModelConfig(
    modelId: string | undefined,
    defaults: { base: string; key: string; modelName: string; platform: string }
  ) {
    let { base, key, modelName, platform } = defaults;
    let provider: any = null;
    
    if (!modelId) {
      // Create provider for defaults
      provider = createOpenAI({
        baseURL: base,
        apiKey: key,
      });
      return { base, key, modelName, platform, provider };
    }
    
    const now = Date.now();
    const cached = this.modelCache.get(modelId);
    if (cached && cached.expires > now) {
      return {
        base: cached.base ?? base,
        key: cached.key ?? key,
        modelName: cached.modelName ?? modelName,
        platform: cached.platform ?? platform,
        provider: cached.provider,
      };
    }
    try {
      const model = await this.prisma.client.model.findUnique({ where: { id: modelId } });
      if (model) {
        modelName = (model as any).modelId || modelName;
        if (model.baseURL) base = model.baseURL;
        if (model.apiKey) key = model.apiKey;
        if ((model as any).platform) platform = (model as any).platform;
      }
    } catch {}
    
    // 创建provider
    provider = createOpenAI({
      baseURL: base,
      apiKey: key,
    });
    
    if (modelId) {
      this.modelCache.set(modelId, {
        modelName,
        base,
        key,
        platform,
        provider,
        expires: now + this.MODEL_TTL_MS,
      });
    }
    
    return { base, key, modelName, platform, provider };
  }

  async streamChat(
    messages: Array<{ role: string; content: string }>,
    modelId: string | undefined
  ) {
    console.log('[AI Service] Starting stream chat with modelId:', modelId);
    const defaults = {
      base: process.env.IFLOW_BASE_URL ?? "https://apis.iflow.cn/v1",
      key: process.env.IFLOW_API_KEY ?? "",
      modelName: "qwen3-max",
      platform: "openai",
    };
    
    const { modelName, base, key } = await this.resolveModelConfig(modelId, defaults);
    console.log('[AI Service] Resolved model:', modelName);
    
    if (!modelName || !base || !key) {
      throw new Error("Model configuration not found");
    }

    // 直接使用 OpenAI 客户端
    console.log('[AI Service] Creating OpenAI client');
    const openai = new OpenAI({
      baseURL: base,
      apiKey: key,
    });
    
    console.log('[AI Service] Starting stream at', new Date().toISOString());
    const stream = await openai.chat.completions.create({
      model: modelName,
      messages: messages as any,
      stream: true,
      max_tokens: 256,
      temperature: 0.3,
      top_p: 0.8,
      frequency_penalty: 0.3,
      presence_penalty: 0.3,
    });
    console.log('[AI Service] Got stream - returning immediately for real-time processing');

    return stream;
  }

  clearModelCache(modelId: string) {
    this.modelCache.delete(modelId);
  }
}