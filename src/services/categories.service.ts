import { api } from '@/lib/api-client';
import { Category } from '@/types/frontend-api';

/**
 * Categories Service
 * Handles category-related API calls
 */
export const categoriesService = {
    /**
     * Get all categories
     */
    getAll: async (): Promise<Category[]> => {
        return api.get<Category[]>('/categories');
    },

    /**
     * Get category by ID
     */
    getById: async (id: string): Promise<Category> => {
        return api.get<Category>(`/categories/${id}`);
    },

    /**
     * Create new category (requires authentication)
     */
    create: async (data: { name: string; description?: string }): Promise<Category> => {
        return api.post<Category>('/categories', data);
    },

    /**
     * Update category (requires authentication)
     */
    update: async (id: string, data: Partial<Category>): Promise<Category> => {
        return api.put<Category>(`/categories/${id}`, data);
    },

    /**
     * Delete category (requires authentication)
     */
    delete: async (id: string): Promise<Category> => {
        return api.delete<Category>(`/categories/${id}`);
    },
};
