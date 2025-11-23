'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string>('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login button clicked', { email, password });
    setError('');
    setSuccess('');
    setLoading(true);
    
    const API_BASE = process.env.NEXT_PUBLIC_API_ORIGIN || process.env.API_ORIGIN?.replace('http://localhost:', 'http://localhost:') || '/api';
    
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.access_token) {
        try {
          localStorage.setItem('token', data.access_token);
          // 触发storage事件，通知其他组件更新
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'token',
            oldValue: null,
            newValue: data.access_token,
          }));
        } catch {}
        try {
          const maxAge = 7 * 24 * 60 * 60;
          document.cookie = `token=${data.access_token}; path=/; max-age=${maxAge}`;
        } catch {}
        
        setSuccess('登录成功，正在跳转…');
        
        // 延迟跳转，让用户看到成功消息
        setTimeout(() => {
          router.push('/');
        }, 1000);
      } else {
        const msg = data?.message || data?.error || '账号或密码错误';
        setError(typeof msg === 'string' ? msg : '登录失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            登录 ZaiHub
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                邮箱
              </label>
              <Input
                id="email"
                type="email"
                placeholder="请输入邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                密码
              </label>
              <Input
                id="password"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                {error}
              </div>
            )}
            {success && (
              <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">
                {success}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </Button>
          </form>
          <div className="text-center mt-6 text-sm text-gray-600">
            还没有账号？
            <Link 
              href="/auth/register" 
              className="ml-1 text-blue-600 hover:text-blue-800 hover:underline font-medium"
            >
              立即注册
            </Link>
          </div>
          <div className="text-center mt-4 text-xs text-gray-500">
            <Link href="/" className="hover:text-gray-700 hover:underline">
              返回首页
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}