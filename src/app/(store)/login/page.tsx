import { Suspense } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginPageClient } from "./login-client";

export const metadata: Metadata = {
    title: "Login",
    description: "Sign in to your account",
};

export default async function LoginPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (token) {
        redirect("/");
    }

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
