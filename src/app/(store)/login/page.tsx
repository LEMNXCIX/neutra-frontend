import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginPageClient } from "./login-client";

export const metadata: Metadata = {
    title: "Login",
    description: "Sign in to your account",
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
