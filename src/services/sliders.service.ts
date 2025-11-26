import { api } from '@/lib/api-client';

export type Slider = {
    id: string;
    title: string;
    subtitle?: string;
    image?: string;
    startsAt?: string;
    endsAt?: string;
    active?: boolean;
    createdAt?: string;
    updatedAt?: string;
};

export type CreateSliderDto = {
    title: string;
    subtitle?: string;
    image?: string;
    startsAt?: string;
    endsAt?: string;
    active?: boolean;
};

/**
 * Sliders Service
 * Handles slider-related API calls
 */
export const slidersService = {
    /**
     * Get all sliders
     */
    getAll: async (): Promise<Slider[]> => {
        return api.get<Slider[]>('/sliders');
    },

    /**
     * Get slider by ID
     */
    getById: async (id: string): Promise<Slider> => {
        return api.get<Slider>(`/sliders/${id}`);
    },

    /**
     * Create new slider (requires authentication)
     */
    create: async (data: CreateSliderDto): Promise<Slider> => {
        return api.post<Slider>('/sliders', data);
    },

    /**
     * Update slider (requires authentication)
     */
    update: async (id: string, data: Partial<CreateSliderDto>): Promise<Slider> => {
        return api.put<Slider>(`/sliders/${id}`, data);
    },

    /**
     * Delete slider (requires authentication)
     */
    delete: async (id: string): Promise<Slider> => {
        return api.delete<Slider>(`/sliders/${id}`);
    },
};
