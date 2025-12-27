import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api";

/**
 * POST /api/auth/forgot-password
 * Proxy to backend API for password reset request
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const backendUrl = `${BACKEND_API_URL}/auth/forgot-password`;

        // Detect the original origin (host + protocol)
        const host = req.headers.get("host");
        const protocol = req.headers.get("x-forwarded-proto") || "http";
        const origin = `${protocol}://${host}`;

        const response = await fetch(backendUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-original-origin": origin,
            },
            body: JSON.stringify(body),
            cache: "no-store",
        });

        const data = await response.json();

        return NextResponse.json(data, {
            status: response.status,
        });
    } catch (error) {
        console.error("Error during forgot-password proxy:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
