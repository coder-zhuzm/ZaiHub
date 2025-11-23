'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const router = useRouter();
  useEffect(() => {
    try {
      localStorage.removeItem('token');
    } catch {}
    try {
      document.cookie = 'token=; path=/; max-age=0';
    } catch {}
    router.replace('/auth');
  }, [router]);
  return null;
}