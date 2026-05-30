'use client';

import type { UIMessage } from 'ai';

export type ModelSummary = {
  id: string;
  modelId: string;
  name: string;
  platform: string;
};

export type ChatSseEvent =
  | { type: 'start'; runId?: string; modelId?: string; conversationId?: string }
  | { type: 'delta'; runId?: string; content: string }
  | { type: 'error'; runId?: string; message: string; code?: string }
  | { type: 'done'; runId?: string; elapsedMs?: number; usage?: unknown };

export function getApiBase() {
  return process.env.NEXT_PUBLIC_API_ORIGIN || process.env.API_ORIGIN?.replace('http://localhost:', 'http://localhost:') || '/api';
}

export async function listModels(token: string) {
  const res = await fetch(`${getApiBase()}/models`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch models: HTTP ${res.status}`);
  const data = await res.json();
  return ((data.models ?? []) as ModelSummary[]).map((m) => ({
    id: m.id,
    modelId: m.modelId,
    name: m.name,
    platform: m.platform,
  }));
}

export async function streamChat(params: {
  token: string;
  modelId: string;
  conversationId?: string;
  messages: UIMessage[];
  onEvent: (event: ChatSseEvent) => void;
}) {
  const response = await fetch(`${getApiBase()}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.token}`,
    },
    body: JSON.stringify({
      messages: params.messages,
      modelId: params.modelId,
      conversationId: params.conversationId,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/event-stream') || !response.body) {
    const data = await response.json();
    params.onEvent({ type: 'delta', content: data?.content || data?.text || JSON.stringify(data) });
    params.onEvent({ type: 'done' });
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';

    for (const rawEvent of events) {
      const event = parseSseEvent(rawEvent);
      if (event) params.onEvent(event);
    }
  }

  buffer += decoder.decode();
  if (buffer.trim()) {
    const event = parseSseEvent(buffer);
    if (event) params.onEvent(event);
  }
}

function parseSseEvent(rawEvent: string): ChatSseEvent | null {
  const data = rawEvent
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim())
    .join('\n');

  if (!data) return null;

  try {
    return JSON.parse(data) as ChatSseEvent;
  } catch (error) {
    console.warn('Stream parse error:', error);
    return null;
  }
}
