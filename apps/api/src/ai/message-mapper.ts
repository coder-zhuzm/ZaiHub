import { Injectable } from "@nestjs/common";
import type { ProviderMessage } from "./types";

@Injectable()
export class MessageMapper {
  toProviderMessages(messages: any[]): ProviderMessage[] {
    return (messages ?? []).map((message: any) => ({
      role:
        message.role === "assistant"
          ? "assistant"
          : message.role === "system"
          ? "system"
          : "user",
      content: Array.isArray(message.parts)
        ? message.parts
            .map((part: any) => (part?.type === "text" ? part.text : ""))
            .join("")
        : message.content ?? "",
    }));
  }

  getLastUserContent(messages: ProviderMessage[]) {
    return [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
  }
}
