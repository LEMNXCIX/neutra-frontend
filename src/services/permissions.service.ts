import { api } from '@/lib/api-client';
import { Permission, CreatePermissionDTO, UpdatePermissionDTO } from '@/types/permission.types';

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
    create: async (data: CreatePermissionDTO): Promise<Permission> => {
        return api.post<Permission>('/permissions', data);
    },

    /**
     * Update permission (requires authentication)
     */
    update: async (id: string, data: UpdatePermissionDTO): Promise<Permission> => {
        return api.put<Permission>(`/permissions/${id}`, data);
    },

    /**
     * Delete permission (requires authentication)
     */
    delete: async (id: string): Promise<Permission> => {
        return api.delete<Permission>(`/permissions/${id}`);
    },
};
