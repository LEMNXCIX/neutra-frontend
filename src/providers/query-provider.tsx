'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

/**
 * QueryProvider - Proveedor de TanStack Query para la aplicación
 * 
 * Configura las opciones por defecto para todas las queries:
 * - staleTime: 60 segundos antes de considerar datos obsoletos
 * - refetchOnWindowFocus: desactivado para evitar refetch innecesarios
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000, // 1 minuto
                refetchOnWindowFocus: false,
                retry: 1, // Solo un reintento por defecto
            },
            mutations: {
                retry: 0, // No reintentar mutaciones por defecto
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}

export default QueryProvider;
