import { readJsonResponse } from "@/lib/response";
import { NextRequest, NextResponse } from "next/server";
import { getProxyHeaders } from "@/lib/proxy";
import { getBackendUrl } from "@/lib/backend-url";

/**
 * PUT /api/users/[id]
 * Proxy to backend API to update a user by ID
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const body = await req.json();

        const backendUrl = `${getBackendUrl()}/users/${id}`;

        const response = await fetch(backendUrl, {
            method: "PUT",
            headers: getProxyHeaders(req),
            body: JSON.stringify(body),
            cache: "no-store",
        });

        const data = await readJsonResponse(response);

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json(
            { error: "Failed to update user" },
            { status: 500 },
        );
    }
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const response = await fetch(`${getBackendUrl()}/users/find/${id}`, {
            headers: getProxyHeaders(req),
            cache: "no-store",
        });

        const data = await readJsonResponse(response);
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error("Error fetching user:", error);
        return NextResponse.json(
            { error: "Failed to fetch user" },
            { status: 500 },
        );
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const response = await fetch(`${getBackendUrl()}/users/${id}`, {
            method: "DELETE",
            headers: getProxyHeaders(req),
            cache: "no-store",
        });

        const data = await readJsonResponse(response);
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json(
            { error: "Failed to delete user" },
            { status: 500 },
        );
    }
}
