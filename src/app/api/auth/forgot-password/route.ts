import { NextRequest, NextResponse } from "next/server";
import { getProxyHeaders } from "@/lib/proxy";

const getBackendUrl = () => {
    const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api";
    return url.endsWith('/api') ? url : `${url}/api`;
};

const BACKEND_API_URL = getBackendUrl();

/**
 * POST /api/auth/forgot-password
 * Proxy to backend API for password reset request
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const backendUrl = `${BACKEND_API_URL}/auth/forgot-password`;

        const response = await fetch(backendUrl, {
            method: "POST",
            headers: {
                ...getProxyHeaders(req),
                "Content-Type": "application/json",
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
