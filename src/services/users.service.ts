import { api } from '@/lib/api-client';
import { User } from '@/types/user.types';

/**
 * Users Service
 * Handles user management API calls
 * Requires authentication
 */
export const usersService = {
    /**
     * Get all users
     */
    getAll: async (): Promise<User[]> => {
        return api.get<User[]>('/users');
    },

    /**
     * Get user by ID
     */
    getById: async (id: string): Promise<User> => {
        return api.get<User>(`/users/find/${id}`);
    },

    /**
     * Get user statistics
     */
    getStats: async (): Promise<{ totalUsers: number; activeUsers: number }> => {
        return api.get<{ totalUsers: number; activeUsers: number }>('/users/stats');
    },

    /**
     * Update user
     */
    update: async (id: string, data: Partial<User>): Promise<User> => {
        return api.put<User>(`/users/${id}`, data);
    },

    /**
     * Assign role to user
     */
    assignRole: async (id: string, roleId: string): Promise<User> => {
        return api.put<User>(`/users/${id}/role`, { roleId });
    },

    /**
     * Delete user
     */
    delete: async (id: string): Promise<User> => {
        return api.delete<User>(`/users/${id}`);
    },
};
