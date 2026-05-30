export type ProviderMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatSseEvent =
  | { type: "start"; runId?: string; modelId?: string; conversationId?: string }
  | { type: "delta"; runId?: string; content: string }
  | { type: "error"; runId?: string; message: string; code?: string }
  | { type: "done"; runId?: string; elapsedMs?: number; usage?: unknown };

export type ResolvedModelConfig = {
  id?: string;
  modelName: string;
  baseURL: string;
  apiKey: string;
  platform: string;
};
