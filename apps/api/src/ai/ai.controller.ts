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
  @UseGuards(AuthGuard("jwt"))
  async chat(
    @Body() body: { messages: any[]; modelId?: string },
    @Res() res: Response,
    @Req() req: any
  ) {
    const messages = (body?.messages ?? []) as any[];
    const userId = req?.user?.userId ?? "anonymous";
    const now = Date.now();

    const recent = (this.requestLog.get(userId) ?? []).filter(
      (t) => now - t < 60_000
    );
    if (recent.length >= this.MAX_PER_MINUTE) {
      res.status(429).json({ error: "rate_limited: too many requests" });
      return;
    }
    recent.push(now);
    this.requestLog.set(userId, recent);

    const existing = this.activeCounts.get(userId) ?? 0;
    if (existing >= this.MAX_CONCURRENT) {
      res
        .status(429)
        .json({ error: "concurrency_limited: too many in-flight requests" });
      return;
    }
    this.activeCounts.set(userId, existing + 1);

    const decrement = () => {
      const v = this.activeCounts.get(userId) ?? 1;
      this.activeCounts.set(userId, Math.max(0, v - 1));
    };
    res.on("close", decrement);

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

      const stream = await this.ai.streamChat(openaiMessages, body?.modelId);

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          res.write(`data: ${JSON.stringify({ type: "text", content })}\n\n`);
          if (typeof (res as any).flush === "function") {
            (res as any).flush();
          }
        }
      }
      res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
      res.end();
    } catch (error) {
      console.error("AI chat error:", error);
      decrement();
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
