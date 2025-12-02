import { api } from '@/lib/api-client';
import { Role, CreateRoleDTO, UpdateRoleDTO } from '@/types/role.types';

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
    create: async (data: CreateRoleDTO): Promise<Role> => {
        return api.post<Role>('/roles', data);
    },

    /**
     * Update role (requires authentication)
     */
    update: async (id: string, data: UpdateRoleDTO): Promise<Role> => {
        return api.put<Role>(`/roles/${id}`, data);
    },

    /**
     * Delete role (requires authentication)
     */
    delete: async (id: string): Promise<Role> => {
        return api.delete<Role>(`/roles/${id}`);
    },
};
