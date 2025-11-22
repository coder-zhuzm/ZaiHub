/*
 * @Description:
 * @Author: zhuzm
 * @Date: 2025-11-22 20:47:03
 * @LastEditors: zhuzm
 * @LastEditTime: 2025-11-22 22:47:17
 */
import { Controller, Post, Body, UseGuards, Res, Get, Param } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Response } from "express";
import {
  streamText,
  createUIMessageStream,
  pipeUIMessageStreamToResponse,
  convertToModelMessages,
} from "ai";
import { openai } from "@ai-sdk/openai";


@Controller("ai")
export class AiController {
  @Post("chat")
  @UseGuards(AuthGuard("jwt"))
  async chat(@Body() body: { messages: any[] }, @Res() res: Response) {
    const messages = (body.messages ?? []) as any[];
    if (!process.env.OPENAI_API_KEY) {
      const last = messages[messages.length - 1];
      const lastText = Array.isArray(last?.parts)
        ? last.parts.map((p: any) => (p?.type === "text" ? p.text : "")).join("")
        : (last?.content ?? "");
      const id = `mock-${Date.now()}`;
      const now = new Date().toISOString();
      const pool = [
        "这是模拟随机回复片段。",
        "本地开发模式下的随机响应。",
        "我们正在处理你的消息。",
        "一切正常运行中。",
        "已收到你的输入。",
      ];
      const rand = pool[Math.floor(Math.random() * pool.length)];
      const reply = `随机：${rand}\n，原样：${lastText}\n，服务器时间：${now}`;
      const stream = createUIMessageStream({
        execute: async ({ writer }) => {
          writer.write({ type: "start", messageId: id } as any);
          writer.write({ type: "text-start", id } as any);
          const chunks = reply.match(/.{1,8}/g) || [reply];
          for (const chunk of chunks) {
            writer.write({ type: "text-delta", id, delta: chunk } as any);
            await new Promise((r) => setTimeout(r, 120));
          }
          writer.write({ type: "text-end", id } as any);
          writer.write({ type: "finish", finishReason: "stop" } as any);
        },
      });
      pipeUIMessageStreamToResponse({ stream, response: res });
      return;
    }
    const result = await streamText({
      model: openai("gpt-4o-mini"),
      messages: convertToModelMessages(messages as any),
    });
    result.pipeUIMessageStreamToResponse(res);
  }

  @Get("chat/:id/stream")
  @UseGuards(AuthGuard("jwt"))
  async reconnect(@Param("id") id: string, @Res() res: Response) {
    const stream = createUIMessageStream({
      execute: ({ writer }) => {
        writer.write({ type: "start", messageId: id } as any);
        writer.write({ type: "finish", finishReason: "stop" } as any);
      },
    });
    pipeUIMessageStreamToResponse({ stream, response: res });
  }
}
