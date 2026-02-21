
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { TenantForm } from "@/components/admin/tenants/TenantForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Logo from "@/components/logo";
import Link from "next/link";
import { Rocket } from "lucide-react";

export default function TenantOnboardingPage() {
    const router = useRouter();

    const handleSuccess = () => {
        // After creation, we could redirect to the new tenant URL or back home
        // For now, let's go back home where they will see their new tenant in the list
        router.push("/");
    };

    return (
        <main className="min-h-screen bg-white dark:bg-black py-20 px-6 flex flex-col items-center animate-slide-up">
            <div className="w-full max-w-4xl space-y-12">
                {/* Header */}
                <div className="flex flex-col items-center text-center space-y-6">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Link href="/">
                            <Logo size={80} className="text-foreground relative z-10 transition-transform hover:scale-110 duration-500" />
                        </Link>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-none">Initialize Node</h1>
                        <p className="text-muted-foreground font-black uppercase tracking-[0.4em] text-[10px]">Architecting your enterprise grid in real-time</p>
                    </div>
                </div>

                {/* Onboarding Card */}
                <Card className="border-4 border-foreground rounded-none shadow-[24px_24px_0px_0px_rgba(0,0,0,1)] dark:shadow-[24px_24px_0px_0px_rgba(255,255,255,0.1)] bg-background relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-purple-500 to-pink-500" />
                    <CardHeader className="border-b-4 border-foreground pb-10 pt-12 px-10 bg-muted/30">
                        <div className="flex flex-col md:flex-row md:items-center gap-8">
                            <div className="p-5 bg-foreground text-background rounded-3xl shadow-2xl">
                                <Rocket size={40} strokeWidth={2.5} />
                            </div>
                            <div className="space-y-1">
                                <CardTitle className="text-4xl font-black uppercase tracking-tight italic">Instance Setup</CardTitle>
                                <CardDescription className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
                                    Configure core parameters and operational protocols
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10">
                        <TenantForm
                            onSuccess={handleSuccess}
                            onCancel={() => router.push("/")}
                            submitLabel="Launch Instance node →"
                            isWizard={true}
                        />
                    </CardContent>
                </Card>

                {/* Footer */}
                <p className="text-center text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground opacity-50">
                    &copy; 2026 XCIX CORE INFRASTRUCTURE &bull; SECURED DEPLOYMENT
                </p>
            </div>
        </main>
    );
}
