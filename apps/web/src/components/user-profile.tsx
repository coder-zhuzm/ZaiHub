'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { userService, type UserInfo } from '@/lib/user-service';

export default function UserProfile() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [key, setKey] = useState(0); // 用于强制重新渲染
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 获取用户信息
    const getUserInfo = async () => {
      setIsLoading(true);
      
      // 先尝试从API获取
      const apiUser = await userService.getCurrentUser();
      if (apiUser) {
        setUserInfo(apiUser);
      } else {
        // 如果API失败，尝试从token解析
        const tokenUser = userService.parseToken();
        setUserInfo(tokenUser);
      }
      
      setIsLoading(false);
    };
    
    getUserInfo();
  }, [pathname, key]); // 添加pathname和key作为依赖

  // 监听storage变化
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        setKey(prev => prev + 1); // 强制重新渲染
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = () => {
    // 使用userService清除认证信息
    userService.clearToken();
    
    // 触发storage事件，通知其他标签页
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'token',
      oldValue: localStorage.getItem('token'),
      newValue: null,
    }));
    
    // 立即更新状态
    setUserInfo(null);
    
    // 跳转到登录页
    router.push('/auth/login');
  };

  if (isLoading) {
    return (
      <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
    );
  }

  if (!userInfo) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => router.push('/auth/login')}>
          登录
        </Button>
        <Button size="sm" onClick={() => router.push('/auth/register')}>
          注册
        </Button>
      </div>
    );
  }

  // 获取用户名的首字母作为头像
  const userInitial = userInfo.email.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-8 w-8 rounded-full p-0 hover:bg-gray-100"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-blue-500 text-white text-sm font-medium">
              {userInitial}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            <p className="text-sm font-medium leading-none">
              {userInfo.nickname || '用户'}
            </p>
            <p className="text-xs text-muted-foreground">{userInfo.email}</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          退出登录
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}