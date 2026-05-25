'use client';

import { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import type { UIMessage } from 'ai';
import WindowControls from '@/components/window-controls';
import ChatWindow from '@/components/chat-window';
import StatusIndicator from '@/components/status-indicator';
import ChatInput from '@/components/chat-input';
import EmptyState from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const API_BASE = process.env.NEXT_PUBLIC_API_ORIGIN || process.env.API_ORIGIN?.replace('http://localhost:', 'http://localhost:') || '/api';
  const [models, setModels] = useState<{ id: string; modelId: string; name: string; platform: string }[]>([]);
  const [modelsKey, setModelsKey] = useState(0); // 用于强制刷新模型列表
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [windowModels, setWindowModels] = useState<string[]>(['', '', '']); // 最多3个窗口
  const [activeWindows, setActiveWindows] = useState<number>(1); // 活跃窗口数量
  const [chatSessions, setChatSessions] = useState<Record<string, {
    messages: UIMessage[];
    status: string;
    ref: React.RefObject<HTMLDivElement>;
  }>>({});
  const listRefs = useRef<Record<string, React.RefObject<HTMLDivElement | null>>>({});

  useEffect(() => {
    const stored = localStorage.getItem('token');
    if (stored) {
      setToken(stored);
    }
    setIsLoading(false);
  }, []);

  // 快速选择功能
  const handleQuickSelect = (count: number) => {
    setActiveWindows(count);
    const newWindowModels = [...windowModels];

    // 为每个窗口分配模型
    for (let i = 0; i < count; i++) {
      if (models[i] && !newWindowModels.includes(models[i].id)) {
        newWindowModels[i] = models[i].id;
      }
    }

    // 更新选中的模型列表
    const activeModelIds = newWindowModels.slice(0, count).filter(id => id);
    setWindowModels(newWindowModels);
    setSelectedModels(activeModelIds);
  };

  // 为每个窗口的模型创建独立的聊天会话
  useEffect(() => {
    const newSessions: Record<string, any> = {};
    windowModels.forEach((modelId, index) => {
      if (modelId && index < activeWindows && !chatSessions[modelId]) {
        const model = models.find(m => m.id === modelId);
        if (model) {
          if (!listRefs.current[modelId]) {
            listRefs.current[modelId] = { current: null };
          }
          newSessions[modelId] = {
            messages: [],
            status: 'ready',
            ref: listRefs.current[modelId]
          };
        }
      }
    });

    // 只添加新的会话，保留现有的
    setChatSessions(prev => ({ ...prev, ...newSessions }));
  }, [windowModels, activeWindows, models]);

  // 当窗口模型改变时更新选中的模型列表
  useEffect(() => {
    const activeModelIds = windowModels.slice(0, activeWindows).filter(id => id);
    setSelectedModels(activeModelIds);
  }, [windowModels, activeWindows]);

  // 为所有聊天窗口添加自动滚动逻辑
  useEffect(() => {
    Object.keys(chatSessions).forEach(modelId => {
      const session = chatSessions[modelId];
      if (session?.ref?.current) {
        const el = session.ref.current;
        // 获取ScrollArea的内部滚动容器
        const scrollContainer = el.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
          const distance = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight;
          if (distance < 80 || session.status === 'submitted' || session.status === 'streaming') {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
          }
        }
      }
    });
  }, [chatSessions]);

  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/models`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        const fetchedModels = (data.models ?? []).map((m: { id: string; modelId: string; name: string; platform: string }) => ({
          id: m.id,
          modelId: m.modelId,
          name: m.name,
          platform: m.platform
        }));
        setModels(fetchedModels);

        // 初始化时默认选中第一个模型到第一个窗口
        if (fetchedModels.length > 0 && !windowModels[0]) {
          const newWindowModels = [...windowModels];
          newWindowModels[0] = fetchedModels[0].id;
          setWindowModels(newWindowModels);
          setSelectedModels([fetchedModels[0].id]);
        }
      } catch (error) {
        console.error('Failed to fetch models:', error);
      }
    })();
  }, [token, modelsKey]); // 添加modelsKey作为依赖

  // 刷新模型列表的函数
  const refreshModels = () => {
    setModelsKey(prev => prev + 1);
  };

  const handleWindowModelSelect = (windowIndex: number, modelId: string) => {
    const newWindowModels = [...windowModels];
    newWindowModels[windowIndex] = modelId;
    setWindowModels(newWindowModels);
  };

  const retryMessage = async (windowIndex: number) => {
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
    setChatSessions(prev => ({
      ...prev,
      [modelId]: { ...prev[modelId], messages: filteredMessages, status: 'loading' }
    }));

    await sendMessageForModel(lastUserMessage, modelId, false);
    setIsSending(false);
  };

  const sendMessageForModel = async (userMessage: UIMessage, modelId: string, addToHistory = true) => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found in localStorage');
      return;
    }

    const session = chatSessions[modelId];
    if (!session) return;

    // 如果是重试，用户消息已经在历史中，不需要重复添加
    const messages = addToHistory ? [...session.messages, userMessage] : session.messages;

    try {
      const response = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messages,
          modelId
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';
      const isDataStream = response.headers.get('x-vercel-ai-data-stream') === 'v1';
      const isStream = contentType.includes('text/event-stream') || isDataStream;
      
      if (isStream && response.body) {
        const messageId = `ai-${Date.now()}-${modelId}`;
        const decoder = new TextDecoder();
        let fullText = '';

        // 流开始时创建空消息
        setChatSessions(prev => ({
          ...prev,
          [modelId]: {
            ...prev[modelId],
            messages: [...(prev[modelId]?.messages || []), { id: messageId, role: 'assistant', parts: [{ type: 'text', text: '' }] }] as UIMessage[],
            status: 'streaming'
          }
        }));

        // 流式解析
        const reader = response.body.getReader();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          
          // 按空行分割SSE事件，确保每个完整事件单独处理
          const events = chunk.split('\n\n').filter(event => event.trim());
          
          for (const event of events) {
            const lines = event.split('\n');
            
            for (const line of lines) {
              if (!line.trim()) continue;
              
              try {
                // 标准的 SSE 格式: "data: {...}"
                if (line.startsWith('data:')) {
                  const dataStr = line.slice(5).trim();
                  if (dataStr) {
                    const data = JSON.parse(dataStr);
                    
                    if (data.type === 'text' && data.content) {
                      fullText += data.content;
                      
                      // 立即更新消息内容，确保实时渲染
                      flushSync(() => {
                        setChatSessions(prev => {
                          const messages = prev[modelId]?.messages || [];
                          const updatedMessages = messages.map(m => 
                            m.id === messageId 
                              ? { ...m, parts: [{ type: 'text', text: fullText }] }
                              : m
                          );
                          
                          return {
                            ...prev,
                            [modelId]: {
                              ...prev[modelId],
                              messages: updatedMessages as UIMessage[],
                              status: 'streaming'
                            }
                          };
                        });
                      });
                    } else if (data.type === 'done') {
                      // stream ended
                    }
                }
              }
            } catch (e) {
              console.warn('Stream parse error:', e);
            }
          }
        }
        }
        
        // 流结束
        setChatSessions(prev => ({
          ...prev,
          [modelId]: {
            ...prev[modelId],
            status: 'ready'
          }
        }));
      } else {
        const data = await response.json();
        const content = data?.content || data?.text || JSON.stringify(data);
        const aiMessage: UIMessage = { id: `ai-${Date.now()}-${modelId}`, role: 'assistant', parts: [{ type: 'text', text: content }] };
        setChatSessions(prev => ({
          ...prev,
          [modelId]: { ...prev[modelId], messages: [...prev[modelId]?.messages || [], aiMessage], status: 'ready' }
        }));
      }
    } catch (error) {
      console.error(`Failed to send message to model ${modelId}:`, error);
      // const model = models.find(m => m.id === modelId);
      const errorMessage: UIMessage = {
        id: `error-${Date.now()}-${modelId}`,
        role: 'assistant',
        parts: [{ type: 'text', text: `AI服务暂时不可用，请检查API配置或稍后重试` }]
      };

      setChatSessions(prev => ({
        ...prev,
        [modelId]: {
          ...prev[modelId],
          messages: [...prev[modelId]?.messages || [], errorMessage],
          status: 'error'
        }
      }));
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isSending) return;

    setIsSending(true);

    const userMessage: UIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      parts: [{ type: 'text', text: content }]
    };

    // 为所有选中的模型添加用户消息并设置为loading状态
    selectedModels.forEach(modelId => {
      setChatSessions(prev => ({
        ...prev,
        [modelId]: {
          ...prev[modelId],
          messages: [...prev[modelId]?.messages || [], userMessage],
          status: 'loading'
        }
      }));
    });

    // 清空输入框
    setChatInput('');

    // 为每个选中的模型并行发送消息
    const promises = selectedModels.map(modelId => sendMessageForModel(userMessage, modelId));
    await Promise.allSettled(promises);

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
    <div className="flex flex-col h-full bg-gray-50">
      {/* 快速选择和布局控制 */}
      <WindowControls
        models={models}
        activeWindows={activeWindows}
        onQuickSelect={handleQuickSelect}
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
                    onModelSelect={handleWindowModelSelect}
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
  );
}