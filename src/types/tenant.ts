
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
    config?: TenantConfig;
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

export interface TenantFeatures {
    coupons?: boolean; // Enable/disable coupons globally
    appointmentCoupons?: boolean; // Enable/disable coupons for appointments
    banners?: boolean; // Enable/disable banners
    orders?: boolean; // Enable/disable orders
    [key: string]: boolean | undefined;
}

export interface TenantConfig {
    features?: TenantFeatures;
    [key: string]: any;
}

