import { createFileRoute } from "@tanstack/react-router";
import { RegisterPageClient } from "@/app/(store)/register/register-client";

export const Route = createFileRoute("/_store/register/")({
    head: () => ({
        meta: [
            { title: "Registrarse" },
            { name: "description", content: "Crear una nueva cuenta" },
        ],
    }),
    component: RegisterRoute,
});

function RegisterRoute() {
    return <RegisterPageClient />;
}
