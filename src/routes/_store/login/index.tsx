import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { LoginPageClient } from "@/app/(store)/login/login-client";

export const Route = createFileRoute("/_store/login/")({
    head: () => ({
        meta: [
            { title: "Iniciar Sesión" },
            { name: "description", content: "Inicia sesión en tu cuenta" },
        ],
    }),
    component: LoginRoute,
});

function LoginRoute() {
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
