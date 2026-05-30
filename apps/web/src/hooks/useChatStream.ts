'use client';

import { useState } from 'react';
import type { UIMessage } from 'ai';
import { streamChat } from '@/lib/chat-api';

export function useChatStream(actions: {
  appendAssistantDelta: (modelId: string, messageId: string, content: string) => void;
  failModel: (modelId: string, text: string) => void;
  finishModel: (modelId: string) => void;
  startAssistantMessage: (modelId: string, messageId: string) => void;
}) {
  const [isSending, setIsSending] = useState(false);

  async function sendMessageForModel(params: {
    modelId: string;
    conversationId?: string;
    messages: UIMessage[];
    token: string;
  }) {
    const messageId = `ai-${Date.now()}-${params.modelId}`;
    let fullText = '';
    let started = false;
    let failed = false;

    try {
      await streamChat({
        token: params.token,
        modelId: params.modelId,
        conversationId: params.conversationId,
        messages: params.messages,
        onEvent: (event) => {
          if (event.type === 'start' && !started) {
            started = true;
            actions.startAssistantMessage(params.modelId, messageId);
            return;
          }

          if (event.type === 'delta') {
            if (!started) {
              started = true;
              actions.startAssistantMessage(params.modelId, messageId);
            }
            fullText += event.content;
            actions.appendAssistantDelta(params.modelId, messageId, fullText);
            return;
          }

          if (event.type === 'error') {
            started = true;
            failed = true;
            actions.failModel(params.modelId, event.message || 'AI服务暂时不可用，请检查API配置或稍后重试');
            return;
          }

          if (event.type === 'done') {
            if (failed) return;
            actions.finishModel(params.modelId);
          }
        },
      });

      if (!started && !failed) {
        actions.failModel(params.modelId, 'AI服务未返回内容，请稍后重试');
      }
    } catch (error) {
      console.error(`Failed to send message to model ${params.modelId}:`, error);
      actions.failModel(params.modelId, 'AI服务暂时不可用，请检查API配置或稍后重试');
    }
  }

  return {
    isSending,
    sendMessageForModel,
    setIsSending,
  };
}
