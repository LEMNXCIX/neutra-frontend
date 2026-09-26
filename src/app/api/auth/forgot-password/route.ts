import { readJsonResponse } from "@/lib/response";
import { NextRequest, NextResponse } from "next/server";
import { getProxyHeaders } from "@/lib/proxy";
import { getBackendUrl } from "@/lib/backend-url";

/**
 * POST /api/auth/forgot-password
 * Proxy to backend API for password reset request
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const backendUrl = `${getBackendUrl()}/auth/forgot-password`;

        const response = await fetch(backendUrl, {
            method: "POST",
            headers: {
                ...getProxyHeaders(req),
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
            cache: "no-store",
        });

        const data = await readJsonResponse(response);

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
