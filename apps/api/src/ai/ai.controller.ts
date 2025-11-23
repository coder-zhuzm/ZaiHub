/*
 * @Description:
 * @Author: zhuzm
 * @Date: 2025-11-22 20:47:03
 * @LastEditors: zhuzm
 * @LastEditTime: 2025-11-23 23:22:29
 */
import { Controller, Post, Body, UseGuards, Res, Req } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Response } from "express";
import { AiService } from "./ai.service";

@Controller("ai")
export class AiController {
  constructor(private readonly ai: AiService) {}
  private readonly activeCounts = new Map<string, number>();
  private readonly requestLog = new Map<string, number[]>();
  private readonly MAX_CONCURRENT = 3;
  private readonly MAX_PER_MINUTE = 30;

  @Post("chat")
  // @UseGuards(AuthGuard("jwt"))  // 临时禁用认证进行测试
  async chat(
    @Body() body: { messages: any[]; modelId?: string },
    @Res() res: Response,
    @Req() req: any
  ) {
    const messages = (body?.messages ?? []) as any[];
    const userId = req?.user?.userId ?? "anonymous";
    const now = Date.now();

    // 速率限制检查
    const recent = (this.requestLog.get(userId) ?? []).filter(
      (t) => now - t < 60_000
    );
    if (recent.length >= this.MAX_PER_MINUTE) {
      res.status(429).json({ error: "rate_limited: too many requests" });
      return;
    }
    recent.push(now);
    this.requestLog.set(userId, recent);

    // 并发限制检查
    const current = (this.activeCounts.get(userId) ?? 0) + 1;
    if (current > this.MAX_CONCURRENT) {
      res
        .status(429)
        .json({ error: "concurrency_limited: too many in-flight requests" });
      return;
    }
    this.activeCounts.set(userId, current);

    const decrement = () => {
      const v = this.activeCounts.get(userId) ?? 1;
      this.activeCounts.set(userId, Math.max(0, v - 1));
    };
    res.on("close", decrement);

    // 转换消息格式
    const openaiMessages = messages.map((m: any) => ({
      role:
        m.role === "assistant"
          ? "assistant"
          : m.role === "system"
          ? "system"
          : "user",
      content: Array.isArray(m.parts)
        ? m.parts.map((p: any) => (p?.type === "text" ? p.text : "")).join("")
        : m.content ?? "",
    }));

    try {
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("Transfer-Encoding", "chunked");
      res.setHeader("X-Vercel-AI-Data-Stream", "v1");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      console.log("[AI Controller] Starting stream chat");
      console.log("[AI Controller] About to call ai.streamChat at", new Date().toISOString());
      const stream = await this.ai.streamChat(openaiMessages, body?.modelId);
      console.log("[AI Controller] Got stream result at", new Date().toISOString(), "- about to start processing");

      // 直接转发 OpenAI 的流
      console.log("[AI Controller] Processing stream");
      let chunkIndex = 0;
      for await (const chunk of stream) {
        chunkIndex++;
        const timestamp = new Date().toISOString();
        const content = chunk.choices[0]?.delta?.content || "";
        console.log(`[AI Controller] Chunk ${chunkIndex} at ${timestamp}: "${content}"`);
        if (content) {
          res.write(`data: ${JSON.stringify({ type: "text", content })}\n\n`);
          if (typeof (res as any).flush === "function") {
            (res as any).flush();
          }
        } else {
          console.log("[AI Controller] Empty chunk received");
        }
      }
      // 发送结束标记
      res.write(`data: ${JSON.stringify({ type: "done" })}

`);
      res.end();
      console.log("[AI Controller] Stream completed at", new Date().toISOString());
    } catch (error) {
      console.error("AI chat error:", error);
      decrement();
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
