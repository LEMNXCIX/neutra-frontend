import { api } from '@/lib/api-client';

export interface StaffMember {
    id: string;
    userId?: string;
    name: string;
    email?: string;
    phone?: string;
    avatar?: string;
    bio?: string;
    active: boolean;
    workingHours?: Record<string, { start: string; end: string }>;
    serviceIds?: string[];
    tenantId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateStaffDTO {
    name: string;
    email?: string;
    phone?: string;
    bio?: string;
    active?: boolean;
    serviceIds?: string[];
}

export interface UpdateStaffDTO extends Partial<CreateStaffDTO> {}

export const staffService = {
    getAll: async (activeOnly?: boolean, tenantId?: string): Promise<StaffMember[]> => {
        const params = new URLSearchParams();
        if (activeOnly !== undefined) params.append('activeOnly', String(activeOnly));
        if (tenantId) params.append('tenantId', tenantId);
        const qs = params.toString();
        return api.get<StaffMember[]>(`/staff${qs ? `?${qs}` : ''}`);
    },

    getById: async (id: string): Promise<StaffMember> => {
        return api.get<StaffMember>(`/staff/${id}`);
    },

    getMe: async (): Promise<StaffMember> => {
        return api.get<StaffMember>('/staff/me');
    },

    create: async (data: CreateStaffDTO): Promise<StaffMember> => {
        return api.post<StaffMember>('/staff', data);
    },

    update: async (id: string, data: UpdateStaffDTO): Promise<StaffMember> => {
        return api.put<StaffMember>(`/staff/${id}`, data);
    },

    delete: async (id: string): Promise<void> => {
        return api.delete(`/staff/${id}`);
    },

    syncServices: async (staffId: string, serviceIds: string[]): Promise<void> => {
        return api.put(`/staff/${staffId}/services`, { serviceIds });
    },
};