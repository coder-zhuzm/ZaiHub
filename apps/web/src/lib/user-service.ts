// 用户相关的API服务
export interface UserInfo {
  id: string;
  email: string;
  nickname?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

class UserService {
  private API_BASE = process.env.NEXT_PUBLIC_API_ORIGIN || '/api';
  
  // 获取当前用户信息
  async getCurrentUser(): Promise<UserInfo | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const response = await fetch(`${this.API_BASE}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token无效，清除本地存储
          this.clearToken();
        }
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      return null;
    }
  }

  // 获取存储的token
  getToken(): string | null {
    try {
      return localStorage.getItem('token');
    } catch {
      return null;
    }
  }

  // 清除token
  clearToken(): void {
    try {
      localStorage.removeItem('token');
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    } catch {
      // 忽略错误
    }
  }

  // 从token解析基本信息（备用方案）
  parseToken(): UserInfo | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        createdAt: payload.iat ? new Date(payload.iat * 1000).toISOString() : '',
        updatedAt: new Date().toISOString(),
      };
    } catch {
      return null;
    }
  }
}

export const userService = new UserService();