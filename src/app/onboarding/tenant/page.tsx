import type { Metadata } from "next";
import { TenantOnboardingPageClient } from "./tenant-onboarding-client";

export const metadata: Metadata = {
  title: "Launch New Instance",
  description: "Set up a new business instance on the platform",
};

export default function TenantOnboardingPage() {
  return <TenantOnboardingPageClient />;
}
