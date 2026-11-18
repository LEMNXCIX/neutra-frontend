import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { WhatsAppConfigForm } from "@/components/admin/whatsapp/WhatsAppConfigForm";
import type { WhatsAppConfig } from "@/services/whatsapp.service";

const getWhatsAppConfig = createServerFn({ method: "GET" }).handler(
    async () => {
        const { api } = await import("@/lib/api-client");
        try {
            const initialConfig = await api.get<WhatsAppConfig>(
                "/admin/whatsapp/config",
            );
            return { initialConfig };
        } catch {
            return { initialConfig: null as Partial<WhatsAppConfig> | null };
        }
    },
);

export const Route = createFileRoute("/_storeAdmin/store-admin/whatsapp/")({
    loader: () => getWhatsAppConfig(),
    head: () => ({
        meta: [
            { title: "Configuración de WhatsApp | Administración" },
            {
                name: "description",
                content: "Gestiona la integración con WhatsApp Business API",
            },
        ],
    }),
    component: StoreAdminWhatsappRoute,
});

function StoreAdminWhatsappRoute() {
    const { initialConfig } = Route.useLoaderData();
    return (
        <div className="container py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">
                    Integración de WhatsApp
                </h1>
                <p className="text-muted-foreground">
                    Conectá tu cuenta comercial de Meta para habilitar
                    notificaciones automáticas y un bot conversacional.
                </p>
            </div>
            <WhatsAppConfigForm initialConfig={initialConfig} />
        </div>
    );
}
