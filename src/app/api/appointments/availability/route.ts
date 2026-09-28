import { type NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backend-url";
import { getProxyHeaders } from "@/lib/proxy";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.toString();
    const url = `${getBackendUrl()}/appointments/availability?${query}`;

    try {
        const headers = getProxyHeaders(request);

        const response = await fetch(url, {
            method: "GET",
            headers,
            cache: "no-store",
        });

        if (!response.ok) {
            const _text = await response.text();
            return NextResponse.json(
                {
                    success: false,
                    message: `Backend error: ${response.status}`,
                },
                { status: response.status },
            );
        }

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        console.error("Error fetching availability:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Internal Server Error",
                error: error.message,
            },
            { status: 500 },
        );
    }
}
