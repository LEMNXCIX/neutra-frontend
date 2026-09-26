import type { Metadata } from "next";
import { TenantOnboardingPageClient } from "./tenant-onboarding-client";

export const metadata: Metadata = {
  title: "Lanzar nueva instancia",
  description: "Configura una nueva instancia de negocio en la plataforma",
};

export default function TenantOnboardingPage() {
  return <TenantOnboardingPageClient />;
}
