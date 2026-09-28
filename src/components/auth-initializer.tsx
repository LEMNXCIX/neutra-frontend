"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth-store";

export function AuthInitializer() {
    const checkSession = useAuthStore((state) => state.checkSession);

    useEffect(() => {
        checkSession();

        const handleUnauthorized = () => {
            if (
                typeof window !== "undefined" &&
                window.location.pathname !== "/login"
            ) {
                toast.error("Tu sesión ha expirado. Inicia sesión nuevamente.");
                window.location.href = "/login";
            }
        };

        window.addEventListener("unauthorized", handleUnauthorized);

        return () => {
            window.removeEventListener("unauthorized", handleUnauthorized);
        };
    }, [checkSession]);

    return null;
}
