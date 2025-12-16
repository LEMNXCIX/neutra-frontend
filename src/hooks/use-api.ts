/**
 * useApi - Hooks genéricos para TanStack Query
 * 
 * Proporciona hooks reutilizables para queries y mutations
 * que integran con el api-client existente.
 */

import {
    useQuery,
    useMutation,
    useQueryClient,
    UseQueryOptions,
} from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api-client';

// ============================================================================
// Types
// ============================================================================

export type QueryKeyFactory<TParams = void> = TParams extends void
    ? () => string[]
    : (params: TParams) => string[];

// ============================================================================
// Generic Query Hook
// ============================================================================

/**
 * Hook genérico para queries GET
 * 
 * @example
 * // Query simple
 * const { data, isLoading } = useApiQuery(['roles'], '/roles');
 * 
 * @example
 * // Query con opciones
 * const { data } = useApiQuery(['role', id], `/roles/${id}`, {
 *     enabled: !!id,
 * });
 */
export function useApiQuery<TData>(
    queryKey: string[],
    endpoint: string,
    options?: Omit<UseQueryOptions<TData, ApiError>, 'queryKey' | 'queryFn'>
) {
    return useQuery<TData, ApiError>({
        queryKey,
        queryFn: () => api.get<TData>(endpoint),
        ...options,
    });
}

// ============================================================================
// Generic Mutation Hooks
// ============================================================================

/**
 * Hook genérico para mutations POST
 * 
 * @example
 * const createRole = useApiPost<Role, CreateRoleDTO>('/roles', {
 *     invalidateKeys: [['roles']],
 *     onSuccess: () => toast.success('Role created'),
 * });
 * 
 * createRole.mutate({ name: 'Admin', level: 1 });
 */
export function useApiPost<TData, TVariables>(
    endpoint: string | ((variables: TVariables) => string),
    options?: {
        invalidateKeys?: string[][];
        onSuccess?: (data: TData, variables: TVariables) => void;
        onError?: (error: ApiError, variables: TVariables) => void;
    }
) {
    const queryClient = useQueryClient();

    return useMutation<TData, ApiError, TVariables>({
        mutationFn: (variables) => {
            const url = typeof endpoint === 'function' ? endpoint(variables) : endpoint;
            return api.post<TData>(url, variables);
        },
        onSuccess: (data, variables) => {
            // Invalidar queries relacionadas
            options?.invalidateKeys?.forEach(key => {
                queryClient.invalidateQueries({ queryKey: key });
            });
            options?.onSuccess?.(data, variables);
        },
        onError: options?.onError,
    });
}

/**
 * Hook genérico para mutations PUT
 */
export function useApiPut<TData, TVariables extends { id: string; data: unknown }>(
    baseEndpoint: string,
    options?: {
        invalidateKeys?: string[][];
        onSuccess?: (data: TData, variables: TVariables) => void;
        onError?: (error: ApiError, variables: TVariables) => void;
    }
) {
    const queryClient = useQueryClient();

    return useMutation<TData, ApiError, TVariables>({
        mutationFn: ({ id, data }) => api.put<TData>(`${baseEndpoint}/${id}`, data),
        onSuccess: (data, variables) => {
            options?.invalidateKeys?.forEach(key => {
                queryClient.invalidateQueries({ queryKey: key });
            });
            options?.onSuccess?.(data, variables);
        },
        onError: options?.onError,
    });
}

/**
 * Hook genérico para mutations DELETE
 */
export function useApiDelete<TData>(
    baseEndpoint: string,
    options?: {
        invalidateKeys?: string[][];
        onSuccess?: (data: TData, id: string) => void;
        onError?: (error: ApiError, id: string) => void;
    }
) {
    const queryClient = useQueryClient();

    return useMutation<TData, ApiError, string>({
        mutationFn: (id) => api.delete<TData>(`${baseEndpoint}/${id}`),
        onSuccess: (data, id) => {
            options?.invalidateKeys?.forEach(key => {
                queryClient.invalidateQueries({ queryKey: key });
            });
            options?.onSuccess?.(data, id);
        },
        onError: options?.onError,
    });
}

/**
 * Hook genérico para mutations PATCH
 */
export function useApiPatch<TData, TVariables extends { id: string; data: unknown }>(
    baseEndpoint: string,
    options?: {
        invalidateKeys?: string[][];
        onSuccess?: (data: TData, variables: TVariables) => void;
        onError?: (error: ApiError, variables: TVariables) => void;
    }
) {
    const queryClient = useQueryClient();

    return useMutation<TData, ApiError, TVariables>({
        mutationFn: ({ id, data }) => api.patch<TData>(`${baseEndpoint}/${id}`, data),
        onSuccess: (data, variables) => {
            options?.invalidateKeys?.forEach(key => {
                queryClient.invalidateQueries({ queryKey: key });
            });
            options?.onSuccess?.(data, variables);
        },
        onError: options?.onError,
    });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Crea una factory de query keys para un recurso
 * 
 * @example
 * const roleKeys = createQueryKeyFactory('roles');
 * roleKeys.all(); // ['roles']
 * roleKeys.detail('123'); // ['roles', '123']
 * roleKeys.list({ page: 1 }); // ['roles', 'list', { page: 1 }]
 */
export function createQueryKeyFactory(resource: string) {
    return {
        all: () => [resource] as const,
        lists: () => [resource, 'list'] as const,
        list: (filters?: Record<string, unknown>) => [resource, 'list', filters] as const,
        details: () => [resource, 'detail'] as const,
        detail: (id: string) => [resource, 'detail', id] as const,
    };
}

// ============================================================================
// Pre-built Query Key Factories
// ============================================================================

export const queryKeys = {
    roles: createQueryKeyFactory('roles'),
    permissions: createQueryKeyFactory('permissions'),
    users: createQueryKeyFactory('users'),
    products: createQueryKeyFactory('products'),
    categories: createQueryKeyFactory('categories'),
    orders: createQueryKeyFactory('orders'),
    cart: createQueryKeyFactory('cart'),
    banners: createQueryKeyFactory('banners'),
    sliders: createQueryKeyFactory('sliders'),
    coupons: createQueryKeyFactory('coupons'),
};
