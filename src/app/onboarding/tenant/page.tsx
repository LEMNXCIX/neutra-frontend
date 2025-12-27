
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
        <main className="min-h-screen bg-muted/30 py-12 px-4 flex flex-col items-center">
            <div className="w-full max-w-4xl space-y-8">
                {/* Header */}
                <div className="flex flex-col items-center text-center space-y-4">
                    <Link href="/">
                        <Logo size={64} className="text-foreground" />
                    </Link>
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black tracking-tighter uppercase italic">XCIX Platforms</h1>
                        <p className="text-muted-foreground font-bold uppercase tracking-widest text-sm">Launch your business in minutes</p>
                    </div>
                </div>

                {/* Onboarding Card */}
                <Card className="border-4 border-foreground rounded-none shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-background">
                    <CardHeader className="border-b-4 border-foreground pb-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary text-primary-foreground">
                                <Rocket size={32} />
                            </div>
                            <div>
                                <CardTitle className="text-3xl font-black uppercase tracking-tight">Create Your Store</CardTitle>
                                <CardDescription className="text-muted-foreground font-medium text-lg">
                                    Configure your new store settings and features.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-8">
                        <TenantForm
                            onSuccess={handleSuccess}
                            onCancel={() => router.push("/")}
                            submitLabel="Launch My Business →"
                            isWizard={true}
                        />
                    </CardContent>
                </Card>

                {/* Footer */}
                <p className="text-center text-xs text-muted-foreground font-bold uppercase tracking-widest">
                    &copy; 2025 XCIX Platforms - All rights reserved
                </p>
            </div>
        </main>
    );
}
