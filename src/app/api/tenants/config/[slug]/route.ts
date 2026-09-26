import { readJsonResponse } from "@/lib/response";
import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backend-url";

/**
 * GET /api/tenants/config/[slug]
 * Public endpoint: resolves tenant config (incl. branding) by slug.
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ slug: string }> },
) {
    try {
        const { slug } = await params;

        const response = await fetch(
            `${getBackendUrl()}/tenants/config/${encodeURIComponent(slug)}`,
            { cache: "no-store" },
        );

        const data = await readJsonResponse(response);
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error("Error fetching tenant config:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch tenant config" },
            { status: 500 },
        );
    }
}
