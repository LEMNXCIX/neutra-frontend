import { api } from '@/lib/api-client';
import { Order, CreateOrderDTO, UpdateOrderDTO, OrderStatus } from '@/types/order.types';

export const ordersService = {
    async create(data: CreateOrderDTO): Promise<Order> {
        return api.post<Order>('/order', data);
    },

    async getByUser(status?: OrderStatus): Promise<Order[]> {
        const url = status ? `/order/getOrderByUser?status=${status}` : '/order/getOrderByUser';
        return api.get<Order[]>(url);
    },

    async getById(id: string): Promise<Order> {
        return api.post<Order>('/order/getOrder', { orderId: id });
    },

    async getStatuses(): Promise<{ value: string; label: string }[]> {
        return api.get<{ value: string; label: string }[]>('/order/statuses');
    },

    async changeStatus(orderId: string, status: OrderStatus): Promise<Order> {
        return api.put<Order>('/order/changeStatus', {
            idOrder: orderId,
            status
        });
    },

    async update(id: string, data: UpdateOrderDTO): Promise<Order> {
        return api.put<Order>(`/order/${id}`, data);
    },

    async getStats(): Promise<{ totalOrders: number; totalRevenue: number }> {
        return api.get<{ totalOrders: number; totalRevenue: number }>('/order/stats');
    }
};
