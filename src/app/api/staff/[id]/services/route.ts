import { readJsonResponse } from "@/lib/response";
import { NextRequest, NextResponse } from "next/server";
import { getProxyHeaders } from "@/lib/proxy";
import { getBackendUrl } from "@/lib/backend-url";

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await context.params;
        const body = await request.json();

        const response = await fetch(`${getBackendUrl()}/staff/${id}/services`, {
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
        console.error("Error syncing staff services:", error);
        return NextResponse.json(
            { success: false, message: "Failed to sync staff services" },
            { status: 500 },
        );
    }
}
