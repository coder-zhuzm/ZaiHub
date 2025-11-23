import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';

interface AuthProps {
  onAuthSuccess: (token: string) => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string>('');
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    const API_BASE = process.env.NEXT_PUBLIC_API_ORIGIN || process.env.API_ORIGIN?.replace('http://localhost:', 'http://localhost:') || '/api';
    const endpoint = isLogin ? `${API_BASE}/auth/login` : `${API_BASE}/auth/register`;
    const body = isLogin
      ? { email, password }
      : { email, password, nickname };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.access_token) {
        try {
          localStorage.setItem('token', data.access_token);
        } catch {}
        try {
          const maxAge = 7 * 24 * 60 * 60;
          document.cookie = `token=${data.access_token}; path=/; max-age=${maxAge}`;
        } catch {}
        onAuthSuccess(data.access_token);
        setSuccess(isLogin ? '登录成功，正在跳转…' : '注册成功，正在跳转…');
        router.replace('/');
      } else {
        const msg = data?.message || data?.error || (isLogin ? '账号或密码错误' : '注册失败');
        setError(typeof msg === 'string' ? msg : '认证失败');
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