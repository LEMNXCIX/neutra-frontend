import type { Metadata } from "next";
import { SuperAdminLoyaltyClient } from "@/components/admin/loyalty/SuperAdminLoyaltyClient";

export const metadata: Metadata = {
    title: "Fidelización global | Superadministración",
    description: "Consulta las campañas de fidelización de todas las organizaciones",
};

export default function AdminLoyaltyPage() {
    return <SuperAdminLoyaltyClient />;
}
