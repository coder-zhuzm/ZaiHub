import { Injectable } from "@nestjs/common";
import type { Response } from "express";
import type { ChatSseEvent } from "./types";

@Injectable()
export class SseWriter {
  open(res: Response) {
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
  }

  write(res: Response, event: ChatSseEvent) {
    if (res.writableEnded) return;
    res.write(`data: ${JSON.stringify(event)}\n\n`);
    if (typeof (res as any).flush === "function") {
      (res as any).flush();
    }
  }

  end(res: Response) {
    if (!res.writableEnded) res.end();
  }
}
