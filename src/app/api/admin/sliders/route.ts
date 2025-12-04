import { NextRequest, NextResponse } from "next/server";
import { backendGet, backendPost } from "@/lib/backend-api";
import { extractTokenFromRequest } from "@/lib/server-auth";

/**
 * GET /api/admin/sliders
 * Proxy to backend API for sliders
 */
export async function GET(req: NextRequest) {
  try {
    const token = extractTokenFromRequest(req);

    // Fetch sliders and stats in parallel, handling errors gracefully
    const [slidersResult, statsResult] = await Promise.all([
      backendGet('/slide', token).catch(err => ({ success: false, error: err.message, data: [] })),
      backendGet('/slide/stats', token).catch(err => ({ success: false, error: err.message }))
    ]);

    if (!slidersResult.success) {
      return NextResponse.json(slidersResult, { status: 500 });
    }

    const sliders = Array.isArray(slidersResult.data) ? slidersResult.data : [];
    const stats = statsResult.success && (statsResult as any).data ? (statsResult as any).data : {
      totalSliders: sliders.length,
      activeSliders: 0,
      withImages: 0
    };

    return NextResponse.json({
      success: true,
      data: sliders,
      stats: stats
    }, {
      status: 200
    });
  } catch (error) {
    console.error("Error fetching sliders from backend:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sliders" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/sliders
 * Create slider via backend
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = extractTokenFromRequest(req);
    const result = await backendPost('/slide', body, token);

    return NextResponse.json(result, {
      status: result.success ? 201 : 500
    });
  } catch (error) {
    console.error("Error creating slider:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create slider" },
      { status: 500 }
    );
  }
}
