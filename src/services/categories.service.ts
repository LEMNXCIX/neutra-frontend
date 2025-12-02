import { api } from '@/lib/api-client';
import { Category, CreateCategoryDTO, UpdateCategoryDTO } from '@/types/category.types';

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
    create: async (data: CreateCategoryDTO): Promise<Category> => {
        return api.post<Category>('/categories', data);
    },

    /**
     * Update category (requires authentication)
     */
    update: async (id: string, data: UpdateCategoryDTO): Promise<Category> => {
        return api.put<Category>(`/categories/${id}`, data);
    },

    /**
     * Delete category (requires authentication)
     */
    delete: async (id: string): Promise<Category> => {
        return api.delete<Category>(`/categories/${id}`);
    },
};
