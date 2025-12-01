import { Product } from './product.types';

export type OrderStatus = 'PENDIENTE' | 'COMPLETADO' | 'CANCELADO';

export interface OrderItem {
    id: string;
    orderId: string;
    productId: string;
    amount: number;
    price: number;
    product?: Product;
}

export interface Order {
    id: string;
    userId: string;
    status: OrderStatus;
    items: OrderItem[];
    createdAt: Date | string;
    updatedAt: Date | string;
    user?: {
        name: string;
        email: string;
    };
    // Extended fields for frontend compatibility (based on existing usage)
    tracking?: string;
    address?: string;
    coupon?: {
        code: string;
        type: string;
        value: number;
        discount: number;
    };
}

export interface CreateOrderDTO {
    userId: string;
    items: {
        productId: string;
        amount: number;
        price: number;
    }[];
}
