import { api } from '@/lib/api-client';
import { Banner, CreateBannerDTO, UpdateBannerDTO } from '@/types/banner.types';

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
    create: async (data: CreateBannerDTO): Promise<Banner> => {
        return api.post<Banner>('/banners', data);
    },

    /**
     * Update banner (requires authentication)
     */
    update: async (id: string, data: UpdateBannerDTO): Promise<Banner> => {
        return api.put<Banner>(`/banners/${id}`, data);
    },

    /**
     * Delete banner (requires authentication)
     */
    delete: async (id: string): Promise<Banner> => {
        return api.delete<Banner>(`/banners/${id}`);
    },

    /**
     * Get banner statistics (requires authentication)
     */
    getStats: async (): Promise<{ totalBanners: number; activeBanners: number }> => {
        return api.get<{ totalBanners: number; activeBanners: number }>('/banners/stats');
    },
};
