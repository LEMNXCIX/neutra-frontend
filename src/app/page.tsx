import type { Metadata } from "next";
import { LandingPageClient } from "./landing-client";

export const metadata: Metadata = {
  title: "XCIX - Your Business Platform",
  description: "E-Commerce and Booking solutions in one platform",
};

export default function LandingPage() {
  return <LandingPageClient />;
}
