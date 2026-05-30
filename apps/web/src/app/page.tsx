'use client';

import { useState, useEffect, useRef } from 'react';
import type { UIMessage } from 'ai';
import WindowControls from '@/components/window-controls';
import ChatWindow from '@/components/chat-window';
import StatusIndicator from '@/components/status-indicator';
import ChatInput from '@/components/chat-input';
import EmptyState from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { listModels, type ModelSummary } from '@/lib/chat-api';
import { useChatSessions } from '@/hooks/useChatSessions';
import { useChatStream } from '@/hooks/useChatStream';
import { useConversations } from '@/hooks/useConversations';

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [models, setModels] = useState<ModelSummary[]>([]);
  const [modelsKey, setModelsKey] = useState(0); // 用于强制刷新模型列表
  const activeConversationIdRef = useRef<string | null>(null);
  const {
    activeWindows,
    appendAssistantDelta,
    appendUserMessage,
    chatSessions,
    failModel,
    finishModel,
    initializeFirstModel,
    loadConversationMessages,
    quickSelect,
    resetSessions,
    selectedModels,
    selectWindowModel,
    setModelLoading,
    startAssistantMessage,
    windowModels,
  } = useChatSessions(models);
  const { isSending, sendMessageForModel, setIsSending } = useChatStream({
    appendAssistantDelta,
    failModel,
    finishModel,
    startAssistantMessage,
  });
  const {
    activeConversationId,
    conversations,
    isLoadingConversations,
    loadConversation,
    refreshConversations,
    removeConversation,
    startNewConversation,
  } = useConversations(token);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    queueMicrotask(() => {
      setToken(getStoredToken());
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        const fetchedModels = await listModels(token);
        setModels(fetchedModels);
        initializeFirstModel(fetchedModels);
        await refreshConversations();
      } catch (error) {
        console.error('Failed to fetch models:', error);
      }
    })();
  }, [token, modelsKey, initializeFirstModel, refreshConversations]);

  // 刷新模型列表的函数
  const refreshModels = () => {
    setModelsKey(prev => prev + 1);
  };

  const handleNewConversation = async () => {
    const conversation = await startNewConversation();
    if (!conversation) return;
    activeConversationIdRef.current = conversation.id;
    resetSessions();
    setChatInput('');
  };

  const handleLoadConversation = async (id: string) => {
    const conversation = await loadConversation(id);
    if (!conversation) return;
    activeConversationIdRef.current = id;
    loadConversationMessages(conversation.messages);
    setChatInput('');
  };

  const handleDeleteConversation = async (id: string) => {
    await removeConversation(id);
    if (activeConversationId === id) {
      activeConversationIdRef.current = null;
      resetSessions();
      setChatInput('');
    }
  };

  const retryMessage = async (windowIndex: number) => {
    if (!token) return;

    const modelId = windowModels[windowIndex];
    if (!modelId) return;

    const session = chatSessions[modelId];
    if (!session || session.messages.length === 0) return;

    const filteredMessages = session.messages.filter(m =>
      !(m.role === 'assistant' && m.parts.some(p =>
        p.type === 'text' && (p.text.includes('连接失败') || p.text.includes('AI服务暂时不可用'))
      ))
    );

    const lastUserMessage = [...filteredMessages].reverse().find(m => m.role === 'user');
    if (!lastUserMessage) return;

    setIsSending(true);
    setModelLoading(modelId, filteredMessages);
    await sendMessageForModel({
      modelId,
      messages: filteredMessages,
      token,
    });
    setIsSending(false);
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isSending || !token) return;

    setIsSending(true);
    let conversationId = activeConversationIdRef.current;

    if (!conversationId) {
      const conversation = await startNewConversation();
      conversationId = conversation?.id ?? null;
      activeConversationIdRef.current = conversationId;
    }

    if (!conversationId) {
      setIsSending(false);
      return;
    }

    const userMessage: UIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      parts: [{ type: 'text', text: content }]
    };

    // 为所有选中的模型添加用户消息并设置为loading状态
    selectedModels.forEach(modelId => {
      appendUserMessage(modelId, userMessage);
    });

    // 清空输入框
    setChatInput('');

    // 为每个选中的模型并行发送消息
    const promises = selectedModels.map((modelId) => sendMessageForModel({
      modelId,
      conversationId,
      messages: [...(chatSessions[modelId]?.messages || []), userMessage],
      token,
    }));
    await Promise.allSettled(promises);
    await refreshConversations();

    // 所有请求完成后重新启用发送
    setIsSending(false);
  };

  // 显示加载状态，避免闪现登录页面
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md p-8">
          <CardHeader className="text-center">
            <CardTitle>请先登录</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">您需要登录后才能使用ZaiHub的聊天功能</p>
            <div className="space-x-4">
              <Link href="/auth/login">
                <Button className="flex-1">登录</Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="outline" className="flex-1">注册</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-50">
      <aside className="w-72 shrink-0 border-r bg-white flex flex-col min-h-0">
        <div className="p-3 border-b space-y-2">
          <Button onClick={handleNewConversation} className="w-full" disabled={isSending}>
            新建会话
          </Button>
          <Button onClick={() => refreshConversations()} variant="outline" className="w-full" disabled={isLoadingConversations}>
            刷新历史
          </Button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="text-xs text-gray-500 text-center py-6">
              暂无历史会话
            </div>
          ) : conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`group flex items-start gap-2 rounded-md border px-2 py-2 text-left transition-colors ${
                conversation.id === activeConversationId
                  ? 'border-blue-200 bg-blue-50'
                  : 'border-transparent hover:bg-gray-50'
              }`}
            >
              <button
                className="min-w-0 flex-1 text-left"
                onClick={() => handleLoadConversation(conversation.id)}
              >
                <div className="truncate text-sm font-medium text-gray-900">
                  {conversation.title}
                </div>
                <div className="mt-1 truncate text-xs text-gray-500">
                  {conversation.lastMessage || `${conversation.messageCount} 条消息`}
                </div>
              </button>
              <button
                className="text-xs text-gray-400 hover:text-red-600"
                onClick={() => handleDeleteConversation(conversation.id)}
                aria-label="删除会话"
              >
                删除
              </button>
            </div>
          ))}
        </div>
      </aside>

      <div className="flex flex-1 min-w-0 flex-col">
      {/* 快速选择和布局控制 */}
      <WindowControls
        models={models}
        activeWindows={activeWindows}
        onQuickSelect={quickSelect}
        selectedModelsCount={selectedModels.length}
        onRefreshModels={refreshModels}
      />

      {/* 主要内容区域 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 聊天窗口区域 - 最多三列单行布局 */}
        <div className="flex-1 p-4 overflow-hidden">
          <div className="h-full max-w-7xl mx-auto relative">
            {/* 动态网格布局 - 根据活跃窗口数量均分空间 */}
            <div className={`grid gap-4 h-full ${activeWindows === 1 ? 'grid-cols-1' :
              activeWindows === 2 ? 'grid-cols-2' :
                'grid-cols-3'
              }`}>
              {[...Array(activeWindows)].map((_, windowIndex) => {
                const modelId = windowModels[windowIndex];
                const model = models.find(m => m.id === modelId);
                if (!model) return null;
                const session = modelId ? chatSessions[modelId] : null;
                return (
                  <ChatWindow
                    key={windowIndex}
                    windowIndex={windowIndex}
                    model={model}
                    session={session}
                    isActive={true}
                    models={models}
                    onModelSelect={selectWindowModel}
                    onRetry={retryMessage}
                  />
                );
              })}
            </div>

            {/* 如果没有模型选择的提示 */}
            {models.length === 0 && (
              <EmptyState onLoginClick={() => {
                alert("请先登录");
              }} />
            )}
          </div>
        </div>

        {/* 总体状态指示器 */}
        <StatusIndicator
          selectedModels={selectedModels}
          windowModels={windowModels}
          chatSessions={chatSessions}
          activeWindows={activeWindows}
        />

        {/* 统一输入框 */}
        <ChatInput
          value={chatInput}
          onChange={setChatInput}
          onSubmit={sendMessage}
          selectedModelsCount={selectedModels.length}
          disabled={isSending}
        />
      </main>
      </div>
    </div>
  );
}

function getStoredToken() {
  const localToken = localStorage.getItem('token');
  if (localToken) return localToken;

  const cookieToken = document.cookie
    .split('; ')
    .find((item) => item.startsWith('token='))
    ?.slice('token='.length);
  if (cookieToken) {
    localStorage.setItem('token', cookieToken);
    return cookieToken;
  }

  return null;
}
