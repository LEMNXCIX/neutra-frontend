import { WhatsAppConfigForm } from "@/components/admin/whatsapp/WhatsAppConfigForm";
import { api } from '@/lib/api-client';
import type { WhatsAppConfig } from "@/services/whatsapp.service";
import { Metadata } from "next";

export const metadata: Metadata = {
	title: "Configuración de WhatsApp | Administración",
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
				<h1 className="text-3xl font-bold tracking-tight">Integración de WhatsApp</h1>
				<p className="text-muted-foreground">
					Conectá tu cuenta comercial de Meta para habilitar notificaciones automáticas y un bot conversacional.
				</p>
			</div>

			<WhatsAppConfigForm initialConfig={initialConfig} />
		</div>
	);
}
