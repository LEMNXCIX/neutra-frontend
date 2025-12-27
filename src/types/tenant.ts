
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
    config?: TenantConfig;
}

export interface UpdateTenantData {
    name?: string;
    slug?: string;
    type?: TenantType;
    active?: boolean;
    config?: TenantConfig;
}

export interface TenantFeatures {
    coupons?: boolean; // Enable/disable coupons globally
    appointmentCoupons?: boolean; // Enable/disable coupons for appointments
    banners?: boolean; // Enable/disable banners
    orders?: boolean; // Enable/disable orders
    [key: string]: boolean | undefined;
}

export interface TenantConfig {
    branding?: {
        primaryColor?: string;
        tenantLogo?: string;
        favicon?: string;
    };
    settings?: {
        supportEmail?: string;
        websiteUrl?: string;
        currency?: string;
        language?: string;
        timezone?: string;
    };
    features?: TenantFeatures;
    notifications?: NotificationSettings;
    [key: string]: any;
}

export interface NotificationSettings {
    // Canales habilitados
    channels?: {
        email?: boolean;      // Enviar notificaciones por email
        whatsapp?: boolean;   // Enviar notificaciones por WhatsApp
        push?: boolean;       // Enviar notificaciones push
    };

    // Configuración por tipo de evento
    events?: {
        appointmentConfirmed?: NotificationChannels;
        appointmentCancelled?: NotificationChannels;
        appointmentPending?: NotificationChannels;
        appointmentReminder?: NotificationChannels;
        orderConfirmed?: NotificationChannels;
        welcome?: NotificationChannels;
        passwordReset?: NotificationChannels;
    };
}

export interface NotificationChannels {
    email?: boolean;
    whatsapp?: boolean;
    push?: boolean;
}


