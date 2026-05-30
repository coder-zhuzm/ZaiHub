import { Injectable } from "@nestjs/common";
import OpenAI from "openai";
import type { ProviderMessage, ResolvedModelConfig } from "./types";

@Injectable()
export class ProviderFactory {
  create(config: ResolvedModelConfig) {
    const client = new OpenAI({
      baseURL: config.baseURL,
      apiKey: config.apiKey,
      timeout: parseInt(process.env.AI_REQUEST_TIMEOUT_MS ?? "20000"),
    });

    return {
      streamChat: (messages: ProviderMessage[]) =>
        client.chat.completions.create({
          model: config.modelName,
          messages: messages as any,
          stream: true,
          max_tokens: parseInt(process.env.AI_MAX_TOKENS ?? "4096"),
          temperature: 0.3,
          top_p: 0.8,
          frequency_penalty: 0.3,
          presence_penalty: 0.3,
        }),
    };
  }
}
