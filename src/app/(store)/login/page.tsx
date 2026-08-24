import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginPageClient } from "./login-client";

export const metadata: Metadata = {
    title: "Iniciar Sesión",
    description: "Iniciá sesión en tu cuenta",
};

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-[80vh] flex items-center justify-center py-20" />
            }
        >
            <LoginPageClient />
        </Suspense>
    );
}
