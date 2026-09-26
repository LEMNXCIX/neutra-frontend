import { readJsonResponse } from "@/lib/response";
import { NextRequest, NextResponse } from "next/server";
import { getProxyHeaders } from "@/lib/proxy";
import { getBackendUrl } from "@/lib/backend-url";

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const response = await fetch(`${getBackendUrl()}/tenants/${id}`, {
            method: "PUT",
            headers: {
                ...getProxyHeaders(request),
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
            cache: "no-store",
        });

        const data = await readJsonResponse(response);
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error("Error updating tenant:", error);
        return NextResponse.json(
            { success: false, message: "Failed to update tenant" },
            { status: 500 },
        );
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const response = await fetch(`${getBackendUrl()}/tenants/${id}`, {
            headers: getProxyHeaders(request),
            cache: "no-store",
        });

        const data = await readJsonResponse(response);
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error("Error fetching tenant details:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch tenant details" },
            { status: 500 },
        );
    }
}
