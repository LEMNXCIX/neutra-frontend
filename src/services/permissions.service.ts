import { api } from '@/lib/api-client';

export type Permission = {
    id: string;
    name: string;
    description?: string;
    resource?: string;
    action?: string;
    createdAt?: string;
    updatedAt?: string;
};

export type CreatePermissionDto = {
    name: string;
    description?: string;
    resource?: string;
    action?: string;
};

/**
 * Permissions Service
 * Handles permission management API calls
 */
export const permissionsService = {
    /**
     * Get all permissions
     */
    getAll: async (): Promise<Permission[]> => {
        return api.get<Permission[]>('/permissions');
    },

    /**
     * Get permission by ID
     */
    getById: async (id: string): Promise<Permission> => {
        return api.get<Permission>(`/permissions/${id}`);
    },

    /**
     * Create new permission (requires authentication)
     */
    create: async (data: CreatePermissionDto): Promise<Permission> => {
        return api.post<Permission>('/permissions', data);
    },

    /**
     * Update permission (requires authentication)
     */
    update: async (id: string, data: Partial<CreatePermissionDto>): Promise<Permission> => {
        return api.put<Permission>(`/permissions/${id}`, data);
    },

    /**
     * Delete permission (requires authentication)
     */
    delete: async (id: string): Promise<Permission> => {
        return api.delete<Permission>(`/permissions/${id}`);
    },
};
