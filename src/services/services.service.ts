import { api } from '@/lib/api-client';

export interface ServiceItem {
    id: string;
    name: string;
    description?: string;
    duration: number;
    price: number;
    categoryId?: string;
    category?: { id: string; name: string };
    active: boolean;
    tenantId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateServiceDTO {
    name: string;
    description?: string;
    duration: number;
    price: number;
    categoryId?: string;
    active?: boolean;
}

export interface UpdateServiceDTO extends Partial<CreateServiceDTO> {}

export const servicesService = {
    getAll: async (params?: { activeOnly?: boolean; tenantId?: string; categoryId?: string }): Promise<ServiceItem[]> => {
        const query = new URLSearchParams();
        if (params?.activeOnly !== undefined) query.append('activeOnly', String(params.activeOnly));
        if (params?.tenantId) query.append('tenantId', params.tenantId);
        if (params?.categoryId) query.append('categoryId', params.categoryId);
        const qs = query.toString();
        return api.get<ServiceItem[]>(`/services${qs ? `?${qs}` : ''}`);
    },

    getById: async (id: string): Promise<ServiceItem> => {
        return api.get<ServiceItem>(`/services/${id}`);
    },

    create: async (data: CreateServiceDTO): Promise<ServiceItem> => {
        return api.post<ServiceItem>('/services', data);
    },

    update: async (id: string, data: UpdateServiceDTO): Promise<ServiceItem> => {
        return api.put<ServiceItem>(`/services/${id}`, data);
    },

    delete: async (id: string): Promise<void> => {
        return api.delete(`/services/${id}`);
    },
};