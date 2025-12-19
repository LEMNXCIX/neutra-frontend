export type CategoryType = 'PRODUCT' | 'SERVICE';

export interface Category {
    id: string;
    name: string;
    description?: string | null;
    type: CategoryType;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCategoryDTO {
    name: string;
    description?: string;
    type: CategoryType;
    active?: boolean;
}

export interface UpdateCategoryDTO {
    name?: string;
    description?: string;
    type?: CategoryType;
    active?: boolean;
}
