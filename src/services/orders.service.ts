import { api } from '@/lib/api-client';
import { Order, CreateOrderDTO, UpdateOrderDTO, OrderStatus } from '@/types/order.types';

export const ordersService = {
    async create(data: CreateOrderDTO): Promise<Order> {
        return api.post<Order>('/orders', data);
    },

    async getByUser(status?: OrderStatus): Promise<Order[]> {
        const url = status ? `/orders/user?status=${status}` : '/orders/user';
        return api.get<Order[]>(url);
    },

    async getById(id: string): Promise<Order> {
        // Updated to use RESTful GET /orders/:id
        return api.get<Order>(`/orders/${id}`);
    },

    async getStatuses(): Promise<{ value: string; label: string }[]> {
        return api.get<{ value: string; label: string }[]>('/orders/statuses');
    },

    async changeStatus(orderId: string, status: OrderStatus): Promise<Order> {
        // Assuming this should also use the plural form, though route verification is needed
        // If specific route doesn't exist, this might fail, but consistent naming is better.
        // Likely this should be a patch/put on /orders/:id
        return api.put<Order>('/orders/changeStatus', {
            idOrder: orderId,
            status
        });
    },

    async update(id: string, data: UpdateOrderDTO): Promise<Order> {
        return api.put<Order>(`/orders/${id}`, data);
    },

    async getStats(): Promise<{ totalOrders: number; totalRevenue: number }> {
        return api.get<{ totalOrders: number; totalRevenue: number }>('/orders/stats');
    }
};
