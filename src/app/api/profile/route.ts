import { type NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backend-url";
import { getProxyHeaders } from "@/lib/proxy";
import { readJsonResponse } from "@/lib/response";

/**
 * GET /api/profile
 * Proxy to backend API for user profile
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
        console.error("Error fetching profile:", error);
        return NextResponse.json(
            { error: "Error al obtener el perfil" },
            { status: 401 },
        );
    }
}

/**
 * PUT /api/profile
 * Proxy to backend API to update user profile
 */
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();

        // First get current user ID
        const validateUrl = `${getBackendUrl()}/auth/validate`;
        const validateResponse = await fetch(validateUrl, {
            method: "GET",
            headers: getProxyHeaders(req),
            cache: "no-store",
        });

        const validateData = await readJsonResponse(validateResponse);

        if (!validateData.success || !validateData.data?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const userId = validateData.data.user.id;
        const backendUrl = `${getBackendUrl()}/users/${userId}`;

        const response = await fetch(backendUrl, {
            method: "PUT",
            headers: {
                ...getProxyHeaders(req),
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
            cache: "no-store",
        });

        const data = await readJsonResponse(response);

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error("Error updating profile:", error);
        return NextResponse.json(
            { error: "Error al actualizar el perfil" },
            { status: 500 },
        );
    }
}
