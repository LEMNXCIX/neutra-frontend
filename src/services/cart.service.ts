import { api } from '@/lib/api-client';
import { Cart, AddToCartDTO } from '@/types/cart.types';

/**
 * Cart Service
 * Handles shopping cart API calls
 * Requires authentication
 */
export const cartService = {
    /**
     * Get current user's cart
     */
    get: async (): Promise<Cart> => {
        return api.get<Cart>('/cart');
    },

    /**
     * Create a new cart for user
     */
    create: async (): Promise<Cart> => {
        return api.post<Cart>('/cart');
    },

    /**
     * Add item to cart
     */
    addItem: async (data: AddToCartDTO): Promise<Cart> => {
        return api.post<Cart>('/cart/add', data);
    },

    /**
     * Remove item from cart
     */
    removeItem: async (itemId: string): Promise<Cart> => {
        return api.put<Cart>('/cart/remove', { id: itemId });
    },

    /**
     * Clear entire cart
     */
    clear: async (): Promise<Cart> => {
        return api.delete<Cart>('/cart/clear');
    },
};
