import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { ResetPasswordPageClient } from "@/app/(store)/reset-password/reset-password-client";

export const Route = createFileRoute("/_store/reset-password/")({
    head: () => ({
        meta: [
            { title: "Restablecer Contraseña" },
            {
                name: "description",
                content: "Establece una nueva contraseña para tu cuenta",
            },
        ],
    }),
    component: ResetPasswordRoute,
});

function ResetPasswordRoute() {
    return (
        <Suspense
            fallback={
                <div className="min-h-[80vh] flex items-center justify-center py-20" />
            }
        >
            <ResetPasswordPageClient />
        </Suspense>
    );
}
