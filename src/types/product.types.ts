import { Category } from './category.types';

export interface Product {
    id: string;
    name: string;
    description: string;
    image: string | null;  // Updated to match API - can be null
    price: number;
    stock: number;  // Updated to match API - required, not optional
    active: boolean;
    ownerId: string;
    createdAt?: Date;
    updatedAt?: Date;
    categories?: Category[];
}

export interface CreateProductDTO {
    name: string;
    description: string;
    image?: string;
    price: number;
    stock: number;  // Added stock as required field
    active?: boolean;
    ownerId: string;
    categoryIds?: string[];
}

export interface UpdateProductDTO {
    name?: string;
    description?: string;
    image?: string;
    price?: number;
    stock?: number;
    active?: boolean;
    categoryIds?: string[];
}
