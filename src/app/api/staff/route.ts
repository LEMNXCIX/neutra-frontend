import { readJsonResponse } from "@/lib/response";
import { NextRequest, NextResponse } from "next/server";
import { getProxyHeaders } from "@/lib/proxy";
import { getBackendUrl } from "@/lib/backend-url";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const activeOnly = searchParams.get("activeOnly") ?? "true";

        const response = await fetch(
            `${getBackendUrl()}/staff?activeOnly=${activeOnly}`,
            {
                headers: getProxyHeaders(request),
                cache: "no-store",
            },
        );

        const data = await readJsonResponse(response);
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error("Error fetching staff:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch staff" },
            { status: 500 },
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const response = await fetch(`${getBackendUrl()}/staff`, {
            method: "POST",
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
        console.error("Error creating staff:", error);
        return NextResponse.json(
            { success: false, message: "Failed to create staff" },
            { status: 500 },
        );
    }
}
