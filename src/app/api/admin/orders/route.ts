import { NextRequest, NextResponse } from "next/server";
import { backendGet, backendPost } from "@/lib/backend-api";
import { extractTokenFromRequest } from "@/lib/server-auth";

/**
 * GET /api/admin/orders
 * Proxy to backend API for orders
 */
export async function GET(req: NextRequest) {
  try {
    const token = extractTokenFromRequest(req);

    if (!token) {
      console.error('[BFF Orders] No token found');
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);

    // Extract query parameters
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';

    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query string for backend
    const queryParams = new URLSearchParams();
    if (search) queryParams.set('search', search);
    if (status && status !== 'all') queryParams.set('status', status);
    if (page) queryParams.set('page', page);
    if (limit) queryParams.set('limit', limit);
    if (startDate) queryParams.set('startDate', startDate);
    if (endDate) queryParams.set('endDate', endDate);

    const queryString = queryParams.toString();
    const ordersUrl = queryString ? `/order?${queryString}` : '/order';

    // Build stats query string
    const statsParams = new URLSearchParams();
    if (startDate) statsParams.set('startDate', startDate);
    if (endDate) statsParams.set('endDate', endDate);
    const statsQuery = statsParams.toString();
    const statsUrl = statsQuery ? `/order/stats?${statsQuery}` : '/order/stats';

    // Fetch orders and stats in parallel, handling errors gracefully
    const [ordersResult, statsResult] = await Promise.all([
      backendGet(ordersUrl, token).catch(err => ({ success: false, error: err.message, data: [] })),
      backendGet(statsUrl, token).catch(err => ({ success: false, error: err.message }))
    ]);

    if (!ordersResult.success) {
      return NextResponse.json(ordersResult, { status: (ordersResult as { statusCode?: number }).statusCode || 500 });
    }

    const orders = Array.isArray(ordersResult.data) ? ordersResult.data : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pagination = (ordersResult as any).pagination || {
      page: parseInt(page),
      limit: parseInt(limit),
      total: orders.length,
      totalPages: Math.ceil(orders.length / parseInt(limit))
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stats = statsResult.success && (statsResult as any).data ? (statsResult as any).data : {
      totalOrders: orders.length,
      totalRevenue: 0,
      statusCounts: {}
    };

    return NextResponse.json({
      success: true,
      data: orders,
      orders: orders,
      pagination: pagination,
      stats: stats
    }, {
      status: 200
    });
  } catch (error) {
    console.error("Error fetching orders from backend:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/orders
 * Create order via backend
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = extractTokenFromRequest(req);
    const result = await backendPost('/orders', body, token);

    return NextResponse.json(result, {
      status: result.success ? 201 : 500
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create order" },
      { status: 500 }
    );
  }
}
