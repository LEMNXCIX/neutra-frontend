import { api } from '@/lib/api-client';
import { CartItem, AddToCartDTO } from '@/types/cart.types';

/**
 * Cart Service
 * Handles shopping cart API calls
 * Requires authentication
 */
export const cartService = {
    /**
     * Get current user's cart items
     */
    get: async (): Promise<CartItem[]> => {
        const response = await api.get<CartItem[]>('/cart');
        return response;
    },

    /**
     * Create a new cart for user
     */
    create: async (): Promise<CartItem[]> => {
        return api.post<CartItem[]>('/cart');
    },

    /**
     * Add item to cart
     */
    addItem: async (data: AddToCartDTO): Promise<CartItem[]> => {
        return api.post<CartItem[]>('/cart/add', data);
    },

    /**
     * Remove item from cart
     */
    removeItem: async (itemId: string): Promise<CartItem[]> => {
        return api.put<CartItem[]>('/cart/remove', { id: itemId });
    },

    /**
     * Clear entire cart
     */
    clear: async (): Promise<CartItem[]> => {
        return api.delete<CartItem[]>('/cart/clear');
    },

    /**
     * Get cart statistics (requires authentication)
     */
    getStats: async (): Promise<{ totalItems: number; totalValue: number }> => {
        return api.get<{ totalItems: number; totalValue: number }>('/cart/stats');
    },
};
