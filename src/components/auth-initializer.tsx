"use client";

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';

export function AuthInitializer() {
  const checkSession = useAuthStore((state) => state.checkSession);

  useEffect(() => {
    checkSession();

    const handleUnauthorized = () => {
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        toast.error('Your session has expired. Please login again.');
        window.location.href = '/login';
      }
    };

    window.addEventListener('unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('unauthorized', handleUnauthorized);
    };
  }, [checkSession]);

  return null;
}
