import { api } from '@/lib/api-client';

export interface PlatformFeature {
    id: string;
    key: string;
    name: string;
    description?: string;
    category?: string;
    price: number;
    createdAt?: string;
}

export interface CreateFeatureData {
    key: string;
    name: string;
    description?: string;
    category?: string;
    price?: number;
}

export const featuresService = {
    getAll: async (): Promise<PlatformFeature[]> => {
        return api.get<PlatformFeature[]>('/features');
    },

    getById: async (id: string): Promise<PlatformFeature> => {
        return api.get<PlatformFeature>(`/features/${id}`);
    },

    create: async (data: CreateFeatureData): Promise<PlatformFeature> => {
        return api.post<PlatformFeature>('/features', data);
    },

    update: async (id: string, data: Partial<CreateFeatureData>): Promise<PlatformFeature> => {
        return api.put<PlatformFeature>(`/features/${id}`, data);
    },

    delete: async (id: string): Promise<void> => {
        return api.delete(`/features/${id}`);
    },
};
