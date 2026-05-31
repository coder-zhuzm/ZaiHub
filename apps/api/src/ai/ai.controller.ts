import { Controller, Post, Body, UseGuards, Res, Req } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Response } from "express";
import { ChatRunService } from "./chat-run.service";
import { MessageMapper } from "./message-mapper";
import { ModelResolver } from "./model-resolver";
import { ProviderFactory } from "./provider-factory";
import { SseWriter } from "./sse-writer";

@Controller("ai")
export class AiController {
  constructor(
    private readonly chatRuns: ChatRunService,
    private readonly messageMapper: MessageMapper,
    private readonly modelResolver: ModelResolver,
    private readonly providerFactory: ProviderFactory,
    private readonly sseWriter: SseWriter
  ) {}
  private readonly activeCounts = new Map<string, number>();
  private readonly requestLog = new Map<string, number[]>();
  private readonly MAX_CONCURRENT = 3;
  private readonly MAX_PER_MINUTE = 30;

  @Post("chat")
  @UseGuards(AuthGuard("jwt"))
  async chat(
    @Body() body: { messages: any[]; modelId?: string; conversationId?: string },
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

    let released = false;
    const decrement = () => {
      if (released) return;
      released = true;
      const v = this.activeCounts.get(userId) ?? 1;
      this.activeCounts.set(userId, Math.max(0, v - 1));
    };
    res.on("close", decrement);

    const startedAt = Date.now();
    let runId: string | undefined;
    let conversationId = body?.conversationId;

    try {
      this.sseWriter.open(res);

      const providerMessages = this.messageMapper.toProviderMessages(messages);
      const userContent = this.messageMapper.getLastUserContent(providerMessages);
      const clientMessageId = this.messageMapper.getLastUserMessageId(messages);
      const runContext = await this.chatRuns.start({
        userId,
        modelDbId: body?.modelId,
        conversationId: body?.conversationId,
        clientMessageId,
        userContent,
      });
      runId = runContext?.run.id;
      conversationId = runContext?.conversation.id ?? conversationId;

      const model = await this.modelResolver.resolve(body?.modelId);
      const provider = this.providerFactory.create(model);
      const stream = await provider.streamChat(providerMessages);
      let fullText = "";

      this.sseWriter.write(res, {
        type: "start",
        runId,
        modelId: body?.modelId,
        conversationId: runContext?.conversation.id,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullText += content;
          this.sseWriter.write(res, { type: "delta", runId, content });
        }
      }

      const elapsedMs = Date.now() - startedAt;
      await this.chatRuns.finish({
        runId,
        conversationId: runContext?.conversation.id,
        modelDbId: body?.modelId,
        content: fullText,
        elapsedMs,
      });
      this.sseWriter.write(res, { type: "done", runId, elapsedMs });
    } catch (error) {
      console.error("AI chat error:", error);
      const message = error instanceof Error ? error.message : "Internal server error";
      const elapsedMs = Date.now() - startedAt;
      await this.chatRuns.fail({
        runId,
        conversationId,
        errorMessage: message,
        elapsedMs,
      });
      this.sseWriter.write(res, {
        type: "error",
        runId,
        message: message.includes("timed out")
          ? "模型服务响应超时，请稍后重试或切换模型"
          : "AI服务暂时不可用，请检查API配置或稍后重试",
      });
      this.sseWriter.write(res, { type: "done", runId, elapsedMs });
    } finally {
      decrement();
      this.sseWriter.end(res);
    }
  }
}
