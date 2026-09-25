import type { Metadata } from "next";
import { TenantLoyaltyClient } from "@/components/admin/loyalty/TenantLoyaltyClient";

export const metadata: Metadata = {
    title: "Fidelización | Administración de reservas",
    description: "Administra las campañas de fidelización de la organización",
};

export default function BookingLoyaltyPage() {
    return <TenantLoyaltyClient />;
}
