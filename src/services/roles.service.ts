import { api } from '@/lib/api-client';

export type Role = {
    id: string;
    name: string;
    description?: string;
    permissions?: any[];
    createdAt?: string;
    updatedAt?: string;
};

export type CreateRoleDto = {
    name: string;
    description?: string;
    level?: number;
    permissionIds?: string[];
};

/**
 * Roles Service
 * Handles role management API calls
 */
export const rolesService = {
    /**
     * Get all roles
     */
    getAll: async (): Promise<Role[]> => {
        return api.get<Role[]>('/roles');
    },

    /**
     * Get role by ID
     */
    getById: async (id: string): Promise<Role> => {
        return api.get<Role>(`/roles/${id}`);
    },

    /**
     * Create new role (requires authentication)
     */
    create: async (data: CreateRoleDto): Promise<Role> => {
        return api.post<Role>('/roles', data);
    },

    /**
     * Update role (requires authentication)
     */
    update: async (id: string, data: Partial<CreateRoleDto>): Promise<Role> => {
        return api.put<Role>(`/roles/${id}`, data);
    },

    /**
     * Delete role (requires authentication)
     */
    delete: async (id: string): Promise<Role> => {
        return api.delete<Role>(`/roles/${id}`);
    },
};
