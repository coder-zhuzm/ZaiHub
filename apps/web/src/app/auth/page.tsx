'use client';

import Auth from '@/components/auth';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();
  const handleSuccess = (token: string) => {
    try {
      const maxAge = 7 * 24 * 60 * 60;
      document.cookie = `token=${token}; path=/; max-age=${maxAge}`;
    } catch {}
    router.replace('/');
  };

  return <Auth onAuthSuccess={handleSuccess} />;
}