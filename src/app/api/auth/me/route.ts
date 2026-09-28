import { type NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backend-url";
import { getProxyHeaders } from "@/lib/proxy";
import { readJsonResponse } from "@/lib/response";

/**
 * GET /api/auth/me
 * Proxy to backend API to get current user
 */
export async function GET(req: NextRequest) {
    try {
        const backendUrl = `${getBackendUrl()}/auth/validate`;

        const response = await fetch(backendUrl, {
            method: "GET",
            headers: getProxyHeaders(req),
            cache: "no-store",
        });

        const data = await readJsonResponse(response);

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error("Error validating session:", error);
        return NextResponse.json(
            { error: "Error al validar la sesión" },
            { status: 401 },
        );
    }
}
