
export enum TenantType {
    STORE = 'STORE',
    BOOKING = 'BOOKING',
    HYBRID = 'HYBRID'
}

export interface Tenant {
    id: string;
    name: string;
    slug: string;
    type: TenantType;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTenantData {
    name: string;
    slug: string;
    type: TenantType;
}

export interface UpdateTenantData {
    name?: string;
    slug?: string;
    type?: TenantType;
    active?: boolean;
}
