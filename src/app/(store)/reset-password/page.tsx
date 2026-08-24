import { Suspense } from "react";
import type { Metadata } from "next";
import { ResetPasswordPageClient } from "./reset-password-client";

export const metadata: Metadata = {
    title: "Restablecer Contraseña",
    description: "Establecé una nueva contraseña para tu cuenta",
};

export default function ResetPasswordPage() {
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
