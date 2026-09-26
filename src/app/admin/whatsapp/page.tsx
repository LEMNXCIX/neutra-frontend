import { WhatsAppConfigForm } from "@/components/admin/whatsapp/WhatsAppConfigForm";
import type { WhatsAppConfig } from "@/services/whatsapp.service";
import { Metadata } from "next";
import { api } from '@/lib/api-client';

export const metadata: Metadata = {
    title: "WhatsApp Configuration | Admin",
    description: "Gestiona la integración con WhatsApp Business API",
};

async function fetchWhatsAppConfig(): Promise<Partial<WhatsAppConfig> | null> {
    try {
        return await api.get<WhatsAppConfig>("/admin/whatsapp/config");
    } catch {
        return null;
    }
}

export default async function WhatsAppConfigPage() {
    const initialConfig = await fetchWhatsAppConfig();

    return (
        <div className="container py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">
                    WhatsApp Integration
                </h1>
                <p className="text-muted-foreground">
                    Conecta tu cuenta de Meta Business para activar las notificaciones automáticas y el bot conversacional.
                </p>
            </div>

            <WhatsAppConfigForm initialConfig={initialConfig} />
        </div>
    );
}
