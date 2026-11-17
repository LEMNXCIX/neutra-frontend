import { createFileRoute } from "@tanstack/react-router";
import { ForgotPasswordPageClient } from "@/app/(store)/forgot-password/forgot-password-client";

export const Route = createFileRoute("/_store/forgot-password/")({
    head: () => ({
        meta: [
            { title: "Recuperar Contraseña" },
            {
                name: "description",
                content: "Solicita un enlace para restablecer tu contraseña",
            },
        ],
    }),
    component: ForgotPasswordRoute,
});

function ForgotPasswordRoute() {
    return <ForgotPasswordPageClient />;
}
