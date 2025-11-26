import { api } from '@/lib/api-client';

export type Banner = {
    id: string;
    title: string;
    subtitle?: string;
    image?: string;
    link?: string;
    active?: boolean;
    createdAt?: string;
    updatedAt?: string;
};

export type CreateBannerDto = {
    title: string;
    subtitle?: string;
    image?: string;
    link?: string;
    active?: boolean;
};

/**
 * Banners Service
 * Handles banner-related API calls
 */
export const bannersService = {
    /**
     * Get all banners
     */
    getAll: async (): Promise<Banner[]> => {
        return api.get<Banner[]>('/banners');
    },

    /**
     * Get banner by ID
     */
    getById: async (id: string): Promise<Banner> => {
        return api.get<Banner>(`/banners/${id}`);
    },

    /**
     * Create new banner (requires authentication)
     */
    create: async (data: CreateBannerDto): Promise<Banner> => {
        return api.post<Banner>('/banners', data);
    },

    /**
     * Update banner (requires authentication)
     */
    update: async (id: string, data: Partial<CreateBannerDto>): Promise<Banner> => {
        return api.put<Banner>(`/banners/${id}`, data);
    },

    /**
     * Delete banner (requires authentication)
     */
    delete: async (id: string): Promise<Banner> => {
        return api.delete<Banner>(`/banners/${id}`);
    },
};
