import { Product } from './product.types';

// Updated to match API OrderStatus
export type OrderStatus = 'PENDIENTE' | 'PAGADO' | 'ENVIADO' | 'ENTREGADO';

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
    subtotal: number;  // Added from API
    total: number;  // Added from API
    discountAmount: number;  // Added from API
    couponId?: string | null;  // Added from API
    trackingNumber?: string | null;  // From API
    address?: string | null;  // Shipping address
    coupon?: {  // Applied coupon details
        code: string;
        type: 'percent' | 'fixed';
        value: number;
        discount: number;
    } | null;
    createdAt: Date | string;
    updatedAt: Date | string;
    user?: {
        name: string;
        email: string;
    };
}

export interface CreateOrderDTO {
    userId: string;
    items: {
        productId: string;
        amount: number;
        price: number;
    }[];
    couponId?: string;
}

export interface UpdateOrderDTO {
    status?: OrderStatus;
    trackingNumber?: string;
}
