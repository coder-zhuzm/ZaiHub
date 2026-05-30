'use client';

import { useCallback, useEffect, useState } from 'react';
import type { UIMessage } from 'ai';
import type { ModelSummary } from '@/lib/chat-api';
import type { ConversationMessage } from '@/lib/conversation-api';

export type ChatStatus = 'ready' | 'loading' | 'streaming' | 'error';

export type ChatSession = {
  messages: UIMessage[];
  status: ChatStatus;
};

export function useChatSessions(models: ModelSummary[]) {
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [windowModels, setWindowModels] = useState<string[]>(['', '', '']);
  const [activeWindows, setActiveWindows] = useState(1);
  const [chatSessions, setChatSessions] = useState<Record<string, ChatSession>>({});

  useEffect(() => {
    const newSessions: Record<string, ChatSession> = {};
    windowModels.forEach((modelId, index) => {
      if (modelId && index < activeWindows && !chatSessions[modelId]) {
        const model = models.find((m) => m.id === modelId);
        if (model) {
          newSessions[modelId] = {
            messages: [],
            status: 'ready',
          };
        }
      }
    });

    if (Object.keys(newSessions).length > 0) {
      setChatSessions((prev) => ({ ...prev, ...newSessions }));
    }
  }, [windowModels, activeWindows, models, chatSessions]);

  useEffect(() => {
    setSelectedModels(windowModels.slice(0, activeWindows).filter(Boolean));
  }, [windowModels, activeWindows]);

  useEffect(() => {
    Object.entries(chatSessions).forEach(([modelId, session]) => {
      const el = document.querySelector(`[data-chat-scroll-root="${modelId}"]`);
      const scrollContainer = el?.querySelector('[data-radix-scroll-area-viewport]');
      if (!scrollContainer) return;

      const distance = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight;
      if (distance < 80 || session.status === 'loading' || session.status === 'streaming') {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    });
  }, [chatSessions]);

  const initializeFirstModel = useCallback((fetchedModels: ModelSummary[]) => {
    if (fetchedModels.length === 0 || windowModels[0]) return;
    setWindowModels((prev) => {
      const next = [...prev];
      next[0] = fetchedModels[0].id;
      return next;
    });
    setSelectedModels([fetchedModels[0].id]);
  }, [windowModels]);

  function quickSelect(count: number) {
    setActiveWindows(count);
    setWindowModels((prev) => {
      const next = [...prev];
      for (let i = 0; i < count; i += 1) {
        if (models[i] && !next.includes(models[i].id)) {
          next[i] = models[i].id;
        }
      }
      setSelectedModels(next.slice(0, count).filter(Boolean));
      return next;
    });
  }

  function selectWindowModel(windowIndex: number, modelId: string) {
    setWindowModels((prev) => {
      const next = [...prev];
      next[windowIndex] = modelId;
      return next;
    });
  }

  function resetSessions() {
    setChatSessions({});
  }

  function loadConversationMessages(messages: ConversationMessage[]) {
    const assistantModelIds = Array.from(new Set(
      messages
        .filter((message) => message.role === 'assistant' && message.modelDbId)
        .map((message) => message.modelDbId as string),
    ));
    const modelIds = assistantModelIds.length > 0
      ? assistantModelIds.slice(0, 3)
      : windowModels.filter(Boolean).slice(0, Math.max(activeWindows, 1));

    const nextSessions: Record<string, ChatSession> = {};
    modelIds.forEach((modelId) => {
      nextSessions[modelId] = {
        messages: messages
          .filter((message) => message.role === 'user' || message.modelDbId === modelId)
          .map((message) => ({
            id: message.id,
            role: message.role === 'assistant' ? 'assistant' : 'user',
            parts: [{ type: 'text', text: message.content }],
          })) as UIMessage[],
        status: 'ready',
      };
    });

    setChatSessions(nextSessions);
    setWindowModels((prev) => {
      const next = [...prev];
      modelIds.forEach((modelId, index) => {
        next[index] = modelId;
      });
      for (let i = modelIds.length; i < next.length; i += 1) {
        next[i] = '';
      }
      return next;
    });
    setActiveWindows(Math.max(1, Math.min(3, modelIds.length || 1)));
    setSelectedModels(modelIds);
  }

  function appendUserMessage(modelId: string, message: UIMessage) {
    setChatSessions((prev) => ({
      ...prev,
      [modelId]: {
        ...prev[modelId],
        messages: [
          ...(prev[modelId]?.messages || []).filter((m) => !isTransientErrorMessage(m)),
          message,
        ],
        status: 'loading',
      },
    }));
  }

  function setModelLoading(modelId: string, messages?: UIMessage[]) {
    setChatSessions((prev) => ({
      ...prev,
      [modelId]: {
        ...prev[modelId],
        messages: messages ?? prev[modelId]?.messages ?? [],
        status: 'loading',
      },
    }));
  }

  function startAssistantMessage(modelId: string, messageId: string) {
    const assistantMessage: UIMessage = {
      id: messageId,
      role: 'assistant',
      parts: [{ type: 'text', text: '' }],
    };
    setChatSessions((prev) => ({
      ...prev,
      [modelId]: {
        ...prev[modelId],
        messages: [...(prev[modelId]?.messages || []), assistantMessage],
        status: 'streaming',
      },
    }));
  }

  function appendAssistantDelta(modelId: string, messageId: string, content: string) {
    setChatSessions((prev) => {
      const messages = prev[modelId]?.messages || [];
      return {
        ...prev,
        [modelId]: {
          ...prev[modelId],
          messages: messages.map((message) =>
            message.id === messageId
              ? { ...message, parts: [{ type: 'text', text: content }] }
              : message,
          ) as UIMessage[],
          status: 'streaming',
        },
      };
    });
  }

  function finishModel(modelId: string) {
    setChatSessions((prev) => ({
      ...prev,
      [modelId]: {
        ...prev[modelId],
        status: 'ready',
      },
    }));
  }

  function failModel(modelId: string, text: string) {
    const errorMessage: UIMessage = {
      id: `error-${Date.now()}-${modelId}`,
      role: 'assistant',
      parts: [{ type: 'text', text }],
    };
    setChatSessions((prev) => ({
      ...prev,
      [modelId]: {
        ...prev[modelId],
        messages: [...(prev[modelId]?.messages || []), errorMessage],
        status: 'error',
      },
    }));
  }

  return {
    activeWindows,
    chatSessions,
    selectedModels,
    windowModels,
    appendAssistantDelta,
    appendUserMessage,
    failModel,
    finishModel,
    initializeFirstModel,
    quickSelect,
    loadConversationMessages,
    resetSessions,
    selectWindowModel,
    setModelLoading,
    startAssistantMessage,
  };
}

function isTransientErrorMessage(message: UIMessage) {
  if (message.role !== 'assistant') return false;
  const text = message.parts.map((part) => (part.type === 'text' ? part.text : '')).join('');
  return text.includes('AI服务暂时不可用') || text.includes('模型服务响应超时') || text.includes('连接失败');
}
