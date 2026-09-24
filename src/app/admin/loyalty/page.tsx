import type { Metadata } from "next";
import { SuperAdminLoyaltyClient } from "@/components/admin/loyalty/SuperAdminLoyaltyClient";

export const metadata: Metadata = {
    title: "Fidelización global | Superadministración",
    description: "Administra la fidelización de todas las organizaciones",
};

export default function AdminLoyaltyPage() {
    return <SuperAdminLoyaltyClient />;
}
