
import { api } from "@/lib/api-client";
import { Tenant, CreateTenantData, UpdateTenantData, TenantFeatures } from "@/types/tenant";

export const tenantService = {
    getAll: async () => {
        return api.get<Tenant[]>('/tenants');
    },

    create: async (payload: CreateTenantData) => {
        return api.post<Tenant>('/tenants', payload);
    },

    update: async (id: string, payload: UpdateTenantData) => {
        return api.put<Tenant>(`/tenants/${id}`, payload);
    },

    getFeatures: async (id: string) => {
        return api.get<any>(`/tenants/${id}/features`);
    },

    updateFeatures: async (id: string, features: any) => {
        return api.put<any>(`/tenants/${id}/features`, features);
    },

    delete: async (id: string) => {
        return api.delete(`/tenants/${id}`);
    }
};

