import { api } from '@/lib/api-client';
import { Slideshow, CreateSlideshowDTO, UpdateSlideshowDTO } from '@/types/slide.types';

/**
 * Sliders Service
 * Handles slider-related API calls
 */
export const slidersService = {
    /**
     * Get all sliders
     */
    getAll: async (): Promise<Slideshow[]> => {
        return api.get<Slideshow[]>('/slide');
    },

    /**
     * Get slider by ID
     */
    getById: async (id: string): Promise<Slideshow> => {
        return api.get<Slideshow>(`/slide/${id}`);
    },

    /**
     * Create new slider (requires authentication)
     */
    create: async (data: CreateSlideshowDTO): Promise<Slideshow> => {
        return api.post<Slideshow>('/slide', data);
    },

    /**
     * Update slider (requires authentication)
     */
    update: async (id: string, data: UpdateSlideshowDTO): Promise<Slideshow> => {
        return api.put<Slideshow>(`/slide/${id}`, data);
    },

    /**
     * Delete slider (requires authentication)
     */
    delete: async (id: string): Promise<Slideshow> => {
        return api.delete<Slideshow>(`/slide/${id}`);
    },
};
