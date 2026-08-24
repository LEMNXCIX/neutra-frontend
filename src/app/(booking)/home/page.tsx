import React from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ServicesGrid } from "@/components/booking/services-grid";
import { api } from "@/lib/api-client";
import { getHomeContent } from "@/lib/strapi";
import { getTenantNameFromHeaders } from "@/lib/server-theme";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Home",
    description: "Book appointments and services",
};

export const dynamic = "force-dynamic";

async function getServices() {
    try {
        return (await api.get<any[]>("/services?activeOnly=true")) || [];
    } catch {
        return [];
    }
}

export default async function BookingHomePage() {
    const [services, cms, tenantName] = await Promise.all([
        getServices(),
        getHomeContent(),
        getTenantNameFromHeaders(),
    ]);
    const brandName = tenantName || "XCIX";

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
            {/* HERO */}
            <section className="relative overflow-hidden py-24 md:py-32">
                <div className="absolute inset-0 bg-gradient-to-b from-muted/20 via-transparent to-transparent" />
                <div className="relative max-w-5xl mx-auto px-6 text-center space-y-8">
                    <Badge variant="secondary" className="px-4 py-1 rounded-full">
                        {brandName}
                    </Badge>
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.1]">
                        {cms?.bookingHeroTitle ?? "Book Your"}{" "}
                        <span className="text-primary">
                            {cms?.bookingHeroHighlight ?? "Appointment"}
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium">
                        {cms?.bookingHeroSubtitle ??
                            "Professional services with easy online scheduling. Pick a service, choose your slot, and you're set."}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            size="lg"
                            className="h-14 px-10 text-base font-bold rounded-xl shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all"
                            asChild
                        >
                            <Link href={cms?.bookingCtaHref ?? "/book"}>
                                {cms?.bookingCtaLabel ?? "Book Now"}
                                <ArrowRight className="ml-2 size-5" />
                            </Link>
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="h-14 px-10 text-base font-bold rounded-xl border-border"
                            asChild
                        >
                            <Link href="/services">View Services</Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* SERVICES */}
            <section className="py-16 border-t border-border/50">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="mb-12 text-center">
                        <div className="inline-flex items-center gap-2 text-muted-foreground mb-3">
                            <CalendarDays className="size-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">
                                What we offer
                            </span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-foreground">
                            {cms?.servicesTitle ?? (
                                <>
                                    Our <span className="text-primary">Services</span>
                                </>
                            )}
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            {cms?.servicesSubtitle ??
                                "Choose from our range of professional services tailored to your needs"}
                        </p>
                    </div>
                    <ServicesGrid services={services} />
                </div>
            </section>
        </div>
    );
}
