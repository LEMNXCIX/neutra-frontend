import { NextRequest, NextResponse } from "next/server";
import { backendGet, backendPost } from "@/lib/backend-api";
import { extractTokenFromRequest } from "@/lib/server-auth";

/**
 * GET /api/admin/banners
 * Proxy to backend API for banners
 */
export async function GET(req: NextRequest) {
  try {
    const token = extractTokenFromRequest(req);

    // Fetch banners and stats in parallel, handling errors gracefully
    const [bannersResult, statsResult] = await Promise.all([
      backendGet('/banners/all/list', token).catch(err => ({ success: false, error: err.message, data: [] })),
      backendGet('/banners/stats', token).catch(err => ({ success: false, error: err.message }))
    ]);

    if (!bannersResult.success) {
      console.error("Failed to fetch banners:", bannersResult);
      return NextResponse.json(bannersResult, { status: 500 });
    }

    const banners = Array.isArray(bannersResult.data) ? bannersResult.data : [];

    if (!statsResult.success) {
      console.warn("Failed to fetch banner stats, using fallback:", statsResult);
    }

    const stats = statsResult.success && 'data' in statsResult && statsResult.data
      ? (statsResult as { success: boolean; data: { totalBanners: number; activeBanners: number } }).data
      : {
        totalBanners: banners.length,
        activeBanners: 0
      };


    return NextResponse.json({
      success: true,
      data: banners,
      stats: stats
    }, {
      status: 200
    });
  } catch (error) {
    console.error("Error fetching banners from backend:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch banners" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/banners
 * Create banner via backend
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = extractTokenFromRequest(req);
    const result = await backendPost('/banners', body, token);

    return NextResponse.json(result, {
      status: result.success ? 201 : 500
    });
  } catch (error) {
    console.error("Error creating banner:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create banner" },
      { status: 500 }
    );
  }
}
