import { NextRequest, NextResponse } from "next/server";
import { getProxyHeaders } from "@/lib/proxy";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api";

/**
 * GET /api/categories/[id]
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const backendUrl = `${BACKEND_API_URL}/categories/${id}`;

        const response = await fetch(backendUrl, {
            method: "GET",
            headers: getProxyHeaders(req),
            cache: "no-store",
        });

        const data = await response.json();
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
        const backendUrl = `${BACKEND_API_URL}/categories/${id}`;

        const response = await fetch(backendUrl, {
            method: "PUT",
            headers: {
                ...getProxyHeaders(req),
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
            cache: "no-store",
        });

        const data = await response.json();
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
        const backendUrl = `${BACKEND_API_URL}/categories/${id}`;

        const response = await fetch(backendUrl, {
            method: "DELETE",
            headers: getProxyHeaders(req),
            cache: "no-store",
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error("Error deleting category in backend:", error);
        return NextResponse.json(
            { error: "Failed to delete category" },
            { status: 500 }
        );
    }
}
