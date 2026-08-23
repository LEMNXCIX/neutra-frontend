import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";

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
            `${BACKEND_URL}/tenants/config/${encodeURIComponent(slug)}`,
            { cache: "no-store" },
        );

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error("Error fetching tenant config:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch tenant config" },
            { status: 500 },
        );
    }
}
