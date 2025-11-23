'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import type { UIMessage } from 'ai';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('token');
    if (stored) {
      // 延迟到下一帧再设置 token，避免在 effect 中同步调用 setState
      queueMicrotask(() => setToken(stored));
    } else {
      queueMicrotask(() => setShowAuth(true));
    }
  }, []);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/ai/chat',
      prepareSendMessagesRequest: () => ({
        headers: {
          'Content-Type': 'application/json',
          ...(typeof window !== 'undefined'
            ? (() => {
              const t = token || localStorage.getItem('token');
              return t ? { Authorization: `Bearer ${t}` } : {};
            })()
            : {}),
        },
      }),
    }),
  });
  const [chatInput, setChatInput] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distance < 80 || status === 'submitted' || status === 'streaming') {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, status]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin
      ? { email, password }
      : { email, password, nickname };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.access_token) {
          localStorage.setItem('token', data.access_token);
          setToken(data.access_token);
          setShowAuth(false);
        }
      } else {
        const data = await res.json();
        alert(data.message || '认证失败');
      }
    } catch {
      alert('网络错误');
    }
  };

  if (showAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">
              {isLogin ? '登录 ZaiHub' : '注册 ZaiHub'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              <Input
                type="email"
                placeholder="邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {!isLogin && (
                <Input
                  type="text"
                  placeholder="昵称（可选）"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              )}
              <Button type="submit" className="w-full">
                {isLogin ? '登录' : '注册'}
              </Button>
            </form>
            <p className="text-center mt-4">
              {isLogin ? '没有账号？' : '已有账号？'}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="ml-1 text-blue-500 hover:underline"
              >
                {isLogin ? '注册' : '登录'}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white shadow-sm p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-600">ZaiHub</h1>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              setToken(null);
              setShowAuth(true);
            }}
            className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            退出登录
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 overflow-hidden flex flex-col min-h-0">
        <ScrollArea viewportRef={listRef} className="flex-1 mb-4 min-h-0">
          <div className="space-y-4">
            {messages.map((message: UIMessage) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start gap-2 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <Avatar>
                    <AvatarFallback>{message.role === 'user' ? 'U' : 'AI'}</AvatarFallback>
                  </Avatar>
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-800 border'
                      }`}
                  >
                    {message.parts.map((p) => (p.type === 'text' ? p.text : '')).join('')}
                  </div>
                </div>
              </div>
            ))}
            {(status === 'submitted' || status === 'streaming') && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 border px-4 py-2 rounded-lg">
                  正在思考...
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const value = chatInput.trim();
            if (!value) return;
            sendMessage({ text: value });
            setChatInput('');
          }}
          className="flex gap-2"
        >
          <Input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="输入消息..."
            className="flex-1"
            disabled={status !== 'ready'}
          />
          <Button
            type="submit"
            disabled={status !== 'ready'}
            className="px-6"
          >
            发送
          </Button>
        </form>
      </main>
    </div>
  );
}
