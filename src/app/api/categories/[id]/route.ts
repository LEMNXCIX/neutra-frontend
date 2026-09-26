import { readJsonResponse } from "@/lib/response";
import { NextRequest, NextResponse } from "next/server";
import { getProxyHeaders } from "@/lib/proxy";
import { getBackendUrl } from "@/lib/backend-url";

/**
 * GET /api/categories/[id]
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const backendUrl = `${getBackendUrl()}/categories/${id}`;

        const response = await fetch(backendUrl, {
            method: "GET",
            headers: getProxyHeaders(req),
            cache: "no-store",
        });

        const data = await readJsonResponse(response);
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error("Error fetching category from backend:", error);
        return NextResponse.json(
            { error: "Failed to fetch category" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/categories/[id]
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const backendUrl = `${getBackendUrl()}/categories/${id}`;

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
        console.error("Error updating category in backend:", error);
        return NextResponse.json(
            { error: "Failed to update category" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/categories/[id]
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const backendUrl = `${getBackendUrl()}/categories/${id}`;

        const response = await fetch(backendUrl, {
            method: "DELETE",
            headers: getProxyHeaders(req),
            cache: "no-store",
        });

        const data = await readJsonResponse(response);
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error("Error deleting category in backend:", error);
        return NextResponse.json(
            { error: "Failed to delete category" },
            { status: 500 }
        );
    }
}
