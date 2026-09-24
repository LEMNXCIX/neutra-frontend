"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { getTenantUrl } from "@/lib/tenant";
import { useAuthStore } from "@/store/auth-store";
import { tenantService } from "@/services/tenant.service";
import { Tenant } from "@/types/tenant";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    PlusCircle,
    ShoppingCart,
    Calendar,
} from "lucide-react";
import { NeutralNavigation } from "@/components/neutral-navigation";
import FooterWrapper from "@/components/footer-wrapper";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

export function LandingPageClient() {
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.isAdmin;

  useEffect(() => {
    if (isAdmin) {
      const fetchTenants = async () => {
        try {
          const data = await tenantService.getAll();
          setTenants(data || []);
        } catch (error) {
          console.error("Error fetching tenants:", error);
        }
      };
      fetchTenants();
    }
  }, [isAdmin]);

    if (!isMounted) return null;

    return (
        <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300">
            <NeutralNavigation />

            {/* Hero Section */}
            <section className="container mx-auto px-6 py-24 md:py-40 text-center animate-slide-up">
                <div className="max-w-4xl mx-auto space-y-8">
                    <Badge
                        variant="secondary"
                        className="px-4 py-1 rounded-full mb-4"
                    >
                        Versión 2.5 · Núcleo dinámico
                    </Badge>

                    <h1 className="text-5xl md:text-8xl font-bold mb-6 tracking-tight text-foreground">
                        El núcleo
                        <br />
                        completo de tu negocio.
                    </h1>

                    <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
                        Diseñamos el futuro del comercio multi-inquilino y las
                        citas. Gestiona todo tu negocio desde una plataforma
                        unificada.
                    </p>

                    {user ? (
                        <div className="flex flex-wrap gap-4 justify-center items-center">
                            {isAdmin &&
                                tenants.length > 0 &&
                                tenants.map((tenant) => (
                                    <a
                                        key={tenant.id}
                                        href={getTenantUrl(tenant.slug)}
                                        className={cn(
                                            "flex items-center justify-center gap-3 px-8 py-4 font-semibold text-sm transition-all rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5",
                                            tenant.type === "STORE"
                                                ? "bg-foreground text-background"
                                                : "bg-background text-foreground border border-border",
                                        )}
                                    >
                                        {tenant.type === "STORE" ? (
                                            <ShoppingCart className="size-4" />
                                        ) : (
                                            <Calendar className="size-4" />
                                        )}
                                        <span>{tenant.name}</span>
                                    </a>
                                ))}
                            <Link
                                href="/onboarding/tenant"
                                className="flex items-center justify-center gap-3 px-8 py-4 font-semibold text-sm bg-primary text-primary-foreground hover:opacity-90 transition-all rounded-xl shadow-md hover:-translate-y-0.5"
                            >
                                <PlusCircle className="size-4" />
                                <span>Crear nueva instancia</span>
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                            <Button
                                size="lg"
                                className="h-14 px-10 rounded-xl font-bold text-sm shadow-lg shadow-primary/20"
                                asChild
                            >
                                <Link href="/register">Comenzar ahora</Link>
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                className="h-14 px-10 rounded-xl font-bold text-sm"
                                asChild
                            >
                                <Link href="/login">Acceso seguro</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </section>

            {/* Features Section - Precision Grid */}
            <section className="bg-muted/30 py-24 border-y border-border">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                        {/* E-Commerce Card */}
                        <div className="p-12 t-card space-y-8 group">
                            <div className="size-16 bg-primary/10 text-primary flex items-center justify-center rounded-xl transition-transform group-hover:scale-110 duration-500">
                                <ShoppingCart className="size-8" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-3xl font-bold tracking-tight">
                                    Motor de la tienda
                                </h3>
                                <p className="font-semibold uppercase tracking-widest text-[10px] text-primary">
                                    Núcleo de comercio de alto rendimiento
                                </p>
                            </div>
                            <ul className="space-y-3 text-sm font-medium text-muted-foreground">
                                <li className="flex items-center gap-3">
                                    <div className="size-1.5 rounded-full bg-primary" />
                                    <span>Gestión de inventario</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="size-1.5 rounded-full bg-primary" />
                                    <span>Analítica en tiempo real</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="size-1.5 rounded-full bg-primary" />
                                    <span>Flujo de pago global</span>
                                </li>
                            </ul>
                        </div>

                        {/* Booking Card */}
                        <div className="p-12 t-card space-y-8 group">
                            <div className="size-16 bg-primary/10 text-primary flex items-center justify-center rounded-xl transition-transform group-hover:scale-110 duration-500">
                                <Calendar className="size-8" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-3xl font-bold tracking-tight">
                                    Capa de reservas
                                </h3>
                                <p className="font-semibold uppercase tracking-widest text-[10px] text-primary">
                                    Protocolo de agendas empresariales
                                </p>
                            </div>
                            <ul className="space-y-3 text-sm font-medium text-muted-foreground">
                                <li className="flex items-center gap-3">
                                    <div className="size-1.5 rounded-full bg-primary" />
                                    <span>Disponibilidad de profesionales</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="size-1.5 rounded-full bg-primary" />
                                    <span>Gestión de conflictos</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="size-1.5 rounded-full bg-primary" />
                                    <span>Panel unificado</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            <FooterWrapper minimal tenantName="Neutra SuperAdmin" />
        </div>
    );
}
