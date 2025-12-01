import { Category } from './category.types';

export interface Product {
    id: string;
    name: string;
    description: string;
    image: string;
    price: number;
    ownerId: string;
    createdAt?: Date;
    updatedAt?: Date;
    categories?: Category[];
    stock?: number;
}

export interface CreateProductDTO {
    name: string;
    description: string;
    image?: string;
    price: number;
    ownerId: string;
    categoryIds?: string[];
}

export interface UpdateProductDTO {
    name?: string;
    description?: string;
    image?: string;
    price?: number;
    categoryIds?: string[];
}
