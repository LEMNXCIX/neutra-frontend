import { api } from '@/lib/api-client';
import { Category, CreateCategoryDTO, UpdateCategoryDTO } from '@/types/category.types';

/**
 * Categories Service
 * Handles category-related API calls
 */
export const categoriesService = {
    /**
     * Get all categories (with optional pagination)
     * Note: Pagination info is lost when not using pagination params
     */
    getAll: async (page?: number, limit?: number): Promise<Category[]> => {
        const url = page && limit ? `/categories?page=${page}&limit=${limit}` : '/categories';
        return api.get<Category[]>(url);
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

    /**
     * Get category statistics (requires authentication)
     */
    getStats: async (): Promise<{ totalCategories: number; avgProductsPerCategory: number }> => {
        const response = await api.get('/categories/stats');
        return response.data;
    },
};
