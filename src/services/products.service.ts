import { api } from '@/lib/api-client';
import { Product, CreateProductDTO, UpdateProductDTO } from '@/types/product.types';

/**
 * Products Service
 * Handles product-related API calls
 */
export const productsService = {
    /**
     * Get all products
     */
    getAll: async (): Promise<Product[]> => {
        return api.get<Product[]>('/products');
    },

    /**
     * Get product by ID
     */
    getById: async (id: string): Promise<Product> => {
        return api.get<Product>(`/products/${id}`);
    },

    /**
     * Search products by name
     */
    search: async (name: string): Promise<Product[]> => {
        return api.post<Product[]>('/products/search', { name });
    },

    /**
     * Create new product (requires authentication)
     */
    create: async (data: CreateProductDTO): Promise<Product> => {
        return api.post<Product>('/products', data);
    },

    /**
     * Update product (requires authentication)
     */
    update: async (id: string, data: UpdateProductDTO): Promise<Product> => {
        return api.put<Product>(`/products/${id}`, data);
    },

    /**
     * Delete product (requires authentication)
     */
    delete: async (id: string): Promise<Product> => {
        return api.delete<Product>(`/products/${id}`);
    },
};
