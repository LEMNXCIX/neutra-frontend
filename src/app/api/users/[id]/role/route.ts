import { readJsonResponse } from "@/lib/response";
import { NextRequest, NextResponse } from "next/server";
import { getProxyHeaders } from "@/lib/proxy";
import { getBackendUrl } from "@/lib/backend-url";

/**
 * PUT /api/users/[id]/role
 * Proxy to backend API to assign a role to a user
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();

        const backendUrl = `${getBackendUrl()}/users/${id}/role`;

        const response = await fetch(backendUrl, {
            method: "PUT",
            headers: getProxyHeaders(req),
            body: JSON.stringify(body),
            cache: "no-store",
        });

        const data = await readJsonResponse(response);

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error("Error assigning role to user:", error);
        return NextResponse.json(
            { error: "Failed to assign role to user" },
            { status: 500 }
        );
    }
}

