import { NextRequest, NextResponse } from "next/server";
import { backendGet, backendPost } from "@/lib/backend-api";
import { extractTokenFromRequest } from "@/lib/server-auth";

/**
 * GET /api/admin/coupons
 * Proxy to backend API for coupons
 */
export async function GET(req: NextRequest) {
  try {
    const token = extractTokenFromRequest(req);

    if (!token) {
      console.error('[BFF] No token found in request');
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);

    // Extract query parameters
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';

    // Build query string for backend
    const queryParams = new URLSearchParams();
    if (search) queryParams.set('search', search);
    if (type) queryParams.set('type', type);
    if (status) queryParams.set('status', status);
    if (page) queryParams.set('page', page);
    if (limit) queryParams.set('limit', limit);

    const queryString = queryParams.toString();
    const couponsUrl = queryString ? `/coupons?${queryString}` : '/coupons';

    // Fetch coupons and stats in parallel, handling errors gracefully
    const [couponsResult, statsResult] = await Promise.all([
      backendGet(couponsUrl, token).catch(err => ({ success: false, error: err.message, data: [] })),
      backendGet('/coupons/stats', token).catch(err => ({ success: false, error: err.message }))
    ]);

    if (!couponsResult.success) {
      return NextResponse.json(couponsResult, { status: (couponsResult as { statusCode?: number }).statusCode || 500 });
    }

    const coupons = Array.isArray(couponsResult.data) ? couponsResult.data : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pagination = (couponsResult as any).pagination || {
      page: parseInt(page),
      limit: parseInt(limit),
      total: coupons.length,
      totalPages: Math.ceil(coupons.length / parseInt(limit))
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stats = statsResult.success && (statsResult as any).data ? (statsResult as any).data : {
      totalCoupons: coupons.length,
      activeCoupons: 0,
      usedCoupons: 0,
      unusedCoupons: coupons.length,
      expiredCoupons: 0
    };

    return NextResponse.json({
      success: true,
      data: coupons,
      pagination: pagination,
      stats: stats
    }, {
      status: 200
    });
  } catch (error) {
    console.error("Error fetching coupons from backend:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/coupons
 * Create coupon via backend
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = extractTokenFromRequest(req);
    const result = await backendPost('/coupons', body, token);

    return NextResponse.json(result, {
      status: result.success ? 201 : 500
    });
  } catch (error) {
    console.error("Error creating coupon:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create coupon" },
      { status: 500 }
    );
  }
}
