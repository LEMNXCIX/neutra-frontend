"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';

/**
 * AuthInitializer Component
 * 
 * Initializes authentication state and handles session validation
 * Also sets up global unauthorized event handler
 */
export function AuthInitializer() {
    const checkSession = useAuthStore((state) => state.checkSession);
    const router = useRouter();

    useEffect(() => {
        // Check session on mount
        checkSession();

        // Handle 401 unauthorized events from API calls
        const handleUnauthorized = () => {
            if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
                router.push('/login');
                toast.error('Your session has expired. Please login again.');
            }
        };

        window.addEventListener('unauthorized', handleUnauthorized);

        return () => {
            window.removeEventListener('unauthorized', handleUnauthorized);
        };
    }, [checkSession, router]);

    return null;
}
