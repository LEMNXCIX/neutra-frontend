import { api } from '@/lib/api-client';
import { Order, CreateOrderDTO } from '@/types/order.types';

/**
 * Orders Service
 * Handles order-related API calls
 * Requires authentication
 */
export const ordersService = {
    /**
     * Create new order
     */
    create: async (data: CreateOrderDTO): Promise<Order> => {
        return api.post<Order>('/order', data);
    },

    /**
     * Get all user orders
     */
    getAll: async (): Promise<Order[]> => {
        return api.get<Order[]>('/order');
    },

    /**
     * Get specific order by ID
     */
    getById: async (id: string): Promise<Order> => {
        return api.get<Order>(`/order/getOrder?id=${id}`);
    },
};
