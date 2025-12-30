import { WhatsAppConfigForm } from "@/components/admin/whatsapp/WhatsAppConfigForm";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "WhatsApp Configuration | Admin",
    description: "Manage WhatsApp Business API integration",
};

export default function WhatsAppConfigPage() {
    return (
        <div className="container py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">WhatsApp Integration</h1>
                <p className="text-muted-foreground">
                    Connect your Meta Business Account to enable automated notifications and conversational bot.
                </p>
            </div>

            <WhatsAppConfigForm />
        </div>
    );
}
