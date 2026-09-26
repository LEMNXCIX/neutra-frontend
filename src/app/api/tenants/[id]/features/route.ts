import { NextRequest, NextResponse } from "next/server";
import { getProxyHeaders } from "@/lib/proxy";
import { getBackendUrl } from "@/lib/backend-url";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const response = await fetch(`${getBackendUrl()}/tenants/${id}/features`, {
            headers: getProxyHeaders(request),
            cache: "no-store",
        });

        // Handle successful empty response or errors
        if (!response.ok) {
            const errorBody = await response.text();
            try {
                // Try to parse as JSON first
                return NextResponse.json(JSON.parse(errorBody), {
                    status: response.status,
                });
            } catch {
                // Fallback to text
                return NextResponse.json(
                    { message: errorBody || response.statusText },
                    { status: response.status },
                );
            }
        }

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error("Error fetching tenant features:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch tenant features" },
            { status: 500 },
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const response = await fetch(`${getBackendUrl()}/tenants/${id}/features`, {
            method: "PUT",
            headers: {
                ...getProxyHeaders(request),
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
            cache: "no-store",
        });

        // Handle successful empty response or errors
        if (!response.ok) {
            // ... similar error handling
            const errorBody = await response.text();
            try {
                return NextResponse.json(JSON.parse(errorBody), {
                    status: response.status,
                });
            } catch {
                return NextResponse.json(
                    { message: errorBody || response.statusText },
                    { status: response.status },
                );
            }
        }

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error("Error updating tenant features:", error);
        return NextResponse.json(
            { success: false, message: "Failed to update tenant features" },
            { status: 500 },
        );
    }
}
