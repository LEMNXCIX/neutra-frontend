import { api } from "@/lib/api-client";

export interface WhatsAppConfig {
    phoneNumberId?: string;
    businessAccountId?: string;
    accessToken?: string;
    webhookVerifyToken?: string;
    enabled: boolean;
    notificationsEnabled: boolean;
    botEnabled: boolean;
}

export const whatsappService = {
    async getConfig(): Promise<WhatsAppConfig | null> {
        const response = await api.get<WhatsAppConfig>("/admin/whatsapp/config");
        return response || null;
    },

    async updateConfig(data: Partial<WhatsAppConfig>): Promise<WhatsAppConfig> {
        const response = await api.post<WhatsAppConfig>("/admin/whatsapp/config", data);
        return response;
    }
};
