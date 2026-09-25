"use client";

import Link from "next/link";
import React from "react";
import { Mail, ArrowRight } from "lucide-react";
import { Category } from "@/types/category.types";
import Logo from "@/components/logo";

const EMPTY_CATEGORIES: Category[] = [];

const SOCIAL_LABELS: Record<string, string> = {
    facebook: "f",
    twitter: "t",
    instagram: "ig",
    linkedin: "in",
};

const DEFAULT_SOCIAL_LABELS = ["f", "t", "ig", "in"];

export default function Footer({ minimal = false, tenantName, tenantLogo, footerDescription, socialLinks, initialCategories = EMPTY_CATEGORIES }: { minimal?: boolean; tenantName?: string | null; tenantLogo?: string | null; footerDescription?: string | null; socialLinks?: any[] | null; initialCategories?: Category[] }) {
  const categories = initialCategories.filter((c) => c.active).slice(0, 5);

    return (
        <footer className="bg-background border-t border-border pt-24 pb-12 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
                    {/* Brand Column */}
                    <div className="md:col-span-1 space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-primary/5 rounded-xl border border-primary/10">
                                <Logo size={32} className="text-primary" src={tenantLogo} />
                            </div>
                            <h3 className="text-2xl font-bold tracking-tight text-foreground">
                                {tenantName || "XCIX"}
                            </h3>
                        </div>
                        <p className="text-sm font-medium text-muted-foreground leading-relaxed max-w-[240px]">
                            {footerDescription ??
                                "Redefiniendo la arquitectura digital del comercio moderno y los sistemas de agendado de alto rendimiento."}
                        </p>
                        {/* Social Media Icons */}
                        <div className="flex items-center gap-3">
                            {(socialLinks?.length
                                ? socialLinks
                                : [
                                      { platform: "facebook", url: "" },
                                      { platform: "twitter", url: "" },
                                      { platform: "instagram", url: "" },
                                      { platform: "linkedin", url: "" },
                                  ]
                            ).map((social: any, i: number) => {
                                const label = SOCIAL_LABELS[social.platform] ?? DEFAULT_SOCIAL_LABELS[i % 4];
                                return (
                                    <a
                                        href={social.url || "#"}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        key={social.platform + i}
                                        className="size-10 rounded-full bg-muted/50 border border-transparent hover:border-primary/20 hover:bg-background hover:text-primary transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-300 flex items-center justify-center group"
                                        aria-label={social.platform}
                                    >
                                        <span
                                            aria-hidden="true"
                                            className="size-4 flex items-center justify-center text-xs font-bold leading-none transition-transform group-hover:scale-110"
                                        >
                                            {label}
                                        </span>
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                    {/* Shop Column */}
                    {!minimal && (
                        <div className="space-y-6">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-primary">
                                Catálogo
                            </h4>
                            <ul className="space-y-3">
                                <li>
                                    <Link
                                        href="/products"
                                        className="text-sm font-medium text-muted-foreground hover:text-primary transition-[color,background-color,border-color,box-shadow,opacity,transform] flex items-center group"
                                    >
                                        <ArrowRight className="size-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-[color,background-color,border-color,box-shadow,opacity,transform]" />
                                        Todo el Inventario
                                    </Link>
                                </li>
                                {categories.map((category) => (
                                    <li key={category.id}>
                                        <Link
                                            href={`/products?category=${encodeURIComponent(category.id)}`}
                                            className="text-sm font-medium text-muted-foreground hover:text-primary transition-[color,background-color,border-color,box-shadow,opacity,transform] flex items-center group"
                                        >
                                            <ArrowRight className="size-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-[color,background-color,border-color,box-shadow,opacity,transform]" />
                                            {category.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Customer Service Column */}
                    <div className="space-y-6">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-primary">
                            Asistencia
                        </h4>
                        <ul className="space-y-3">
                            <li>
                                <Link
                                    href="/contact"
                                    className="text-sm font-medium text-muted-foreground hover:text-primary transition-[color,background-color,border-color,box-shadow,opacity,transform] flex items-center group"
                                >
                                    <ArrowRight className="size-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-[color,background-color,border-color,box-shadow,opacity,transform]" />
                                    Centro de Ayuda
                                </Link>
                            </li>
                            {!minimal && (
                                <>
                                    <li>
                                        <Link
                                            href="/shipping"
                                            className="text-sm font-medium text-muted-foreground hover:text-primary transition-[color,background-color,border-color,box-shadow,opacity,transform] flex items-center group"
                                        >
                                            <ArrowRight className="size-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-[color,background-color,border-color,box-shadow,opacity,transform]" />
                                            Información de Envíos
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/returns"
                                            className="text-sm font-medium text-muted-foreground hover:text-primary transition-[color,background-color,border-color,box-shadow,opacity,transform] flex items-center group"
                                        >
                                            <ArrowRight className="size-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-[color,background-color,border-color,box-shadow,opacity,transform]" />
                                            Devoluciones y RMA
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/faq"
                                            className="text-sm font-medium text-muted-foreground hover:text-primary transition-[color,background-color,border-color,box-shadow,opacity,transform] flex items-center group"
                                        >
                                            <ArrowRight className="size-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-[color,background-color,border-color,box-shadow,opacity,transform]" />
                                            Preguntas Frecuentes
                                        </Link>
                                    </li>
                                </>
                            )}
                        </ul>
                    </div>

                    {/* Company Column */}
                    <div className="space-y-6">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-primary">
                            Empresa
                        </h4>
                        <ul className="space-y-3">
                            <li>
                                <Link
                                    href="/about"
                                    className="text-sm font-medium text-muted-foreground hover:text-primary transition-[color,background-color,border-color,box-shadow,opacity,transform] flex items-center group"
                                >
                                    <ArrowRight className="size-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-[color,background-color,border-color,box-shadow,opacity,transform]" />
                                    Nuestra Historia
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/careers"
                                    className="text-sm font-medium text-muted-foreground hover:text-primary transition-[color,background-color,border-color,box-shadow,opacity,transform] flex items-center group"
                                >
                                    <ArrowRight className="size-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-[color,background-color,border-color,box-shadow,opacity,transform]" />
                                    Únete a la Red
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/privacy"
                                    className="text-sm font-medium text-muted-foreground hover:text-primary transition-[color,background-color,border-color,box-shadow,opacity,transform] flex items-center group"
                                >
                                    <ArrowRight className="size-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-[color,background-color,border-color,box-shadow,opacity,transform]" />
                                    Política de Privacidad
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/terms"
                                    className="text-sm font-medium text-muted-foreground hover:text-primary transition-[color,background-color,border-color,box-shadow,opacity,transform] flex items-center group"
                                >
                                    <ArrowRight className="size-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-[color,background-color,border-color,box-shadow,opacity,transform]" />
                                    Términos de Servicio
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-border pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-[11px] font-medium text-muted-foreground" suppressHydrationWarning>
          &copy; {new Date().getFullYear()} XCIX Platforms. Todos
                        los derechos reservados.
                    </p>
                    <div className="flex items-center gap-8">
                        <a
                            href="mailto:support@xcix.com"
                            className="text-[11px] font-semibold text-foreground hover:text-primary transition-[color,background-color,border-color,box-shadow,opacity,transform] flex items-center gap-2"
                        >
                            <Mail className="size-3.5" />
                            support@xcix.com
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
