import { Product } from './product.types';

export interface CartItem {
    id: string;
    cartId: string;
    productId: string;
    amount: number;
    product?: Product;
}

export interface Cart {
    id: string;
    userId: string;
    items: CartItem[];
    createdAt: Date;
    updatedAt: Date;
}

export interface AddToCartDTO {
    productId: string;
    quantity: number;
}
