
import { api } from "@/lib/api-client";
import { Tenant, CreateTenantData, UpdateTenantData } from "@/types/tenant";

export const tenantService = {
    getAll: async () => {
        return api.get<Tenant[]>('/tenants');
    },

    create: async (payload: CreateTenantData) => {
        return api.post<Tenant>('/tenants', payload);
    },

    update: async (id: string, payload: UpdateTenantData) => {
        return api.put<Tenant>(`/tenants/${id}`, payload);
    }
};

