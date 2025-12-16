export interface ErrorDetail {
    code: string;
    message: string;
    field?: string;
    domain?: string;
    metadata?: Record<string, unknown>;
}

export interface StandardResponse<T = unknown> {
    success: boolean;
    statusCode: number;
    message: string;
    data?: T;
    errors?: ErrorDetail[];
    meta: {
        traceId: string;
        timestamp: string;
        [key: string]: unknown;
    };
}

// Entities (based on Prisma Schema)

export interface Role {
    id: string;
    name: string;
    description?: string | null;
    level: number;
    createdAt: string;
    updatedAt: string;
}

export interface Permission {
    id: string;
    name: string;
    description?: string | null;
    createdAt: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    roleId: string;
    role?: Role;
    profilePic?: string | null;
    googleId?: string | null;
    facebookId?: string | null;
    twitterId?: string | null;
    githubId?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface Category {
    id: string;
    name: string;
    description?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface Product {
    id: string;
    name: string;
    price: number;
    description: string;
    image?: string | null;
    stock?: number;
    ownerId: string;
    owner?: User;
    categories?: Category[];
    createdAt: string;
    updatedAt: string;
}

export interface CartItem {
    id: string;
    cartId: string;
    productId: string;
    product?: Product;
    amount: number;
}

export interface Cart {
    id: string;
    userId: string;
    items: CartItem[];
    createdAt: string;
    updatedAt: string;
}

export enum OrderStatus {
    PENDIENTE = 'PENDIENTE',
    PAGADO = 'PAGADO',
    ENVIADO = 'ENVIADO',
    ENTREGADO = 'ENTREGADO',
}

export interface OrderItem {
    id: string;
    orderId: string;
    productId: string;
    product?: Product;
    amount: number;
    price: number;
}

export interface Order {
    id: string;
    userId: string;
    status: OrderStatus;
    items: OrderItem[];
    createdAt: string;
    updatedAt: string;
}

export interface Slideshow {
    id: string;
    title: string;
    img: string;
    desc?: string | null;
    createdAt: string;
    updatedAt: string;
}

// Request DTOs

export interface CreateUserDto {
    name: string;
    email: string;
    password: string;
    provider?: string;
    profilePic?: string;
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface ProductCreateDto {
    name: string;
    description?: string;
    categories?: string[];
    price?: number;
    image?: string[]; // Note: Backend DTO says string[], schema says String? (single). Check controller.
    stock?: number;
}

export interface AddToCartDto {
    productId: string;
    quantity: number;
}

export interface CreateOrderDto {
    userId: string;
    items: Array<{ productId: string; quantity: number }>;
    address?: string;
}
