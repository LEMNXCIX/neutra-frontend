import type { Metadata } from "next";
import { LandingPageClient } from "./landing-client";

export const metadata: Metadata = {
  title: "XCIX - Tu plataforma de negocios",
  description: "Soluciones de comercio electrónico y reservas en una sola plataforma",
};

export default function LandingPage() {
  return <LandingPageClient />;
}
