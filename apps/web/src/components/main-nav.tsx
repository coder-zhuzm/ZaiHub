'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { userService } from '@/lib/user-service';

export default function MainNav() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    queueMicrotask(async () => {
      const user = await userService.getCurrentUser();
      setIsAdmin(user?.role === 'admin');
    });
  }, []);

  return (
    <>
      <Link
        href="/"
        className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
      >
        聊天对比
      </Link>
      {isAdmin && (
        <Link
          href="/admin/models"
          className="text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
        >
          模型管理
        </Link>
      )}
    </>
  );
}
