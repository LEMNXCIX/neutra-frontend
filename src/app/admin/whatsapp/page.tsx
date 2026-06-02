import { WhatsAppConfigForm } from "@/components/admin/whatsapp/WhatsAppConfigForm";
import { backendFetch } from "@/lib/backend-api";
import type { WhatsAppConfig } from "@/services/whatsapp.service";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "WhatsApp Configuration | Admin",
    description: "Manage WhatsApp Business API integration",
};

async function fetchWhatsAppConfig(): Promise<Partial<WhatsAppConfig> | null> {
    try {
        const result = await backendFetch("/admin/whatsapp/config", {
            cache: "no-store",
        });
        if (!result.success) return null;
        return (result as any).data || (result as any) || null;
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
                    Connect your Meta Business Account to enable automated
                    notifications and conversational bot.
                </p>
            </div>

            <WhatsAppConfigForm initialConfig={initialConfig} />
        </div>
    );
}
