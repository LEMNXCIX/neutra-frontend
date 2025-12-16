import { NextRequest, NextResponse } from "next/server";
import { backendGet, backendPost } from "@/lib/backend-api";
import { extractTokenFromRequest } from "@/lib/server-auth";

/**
 * GET /api/admin/products
 * Proxy to backend API for products
 */
export async function GET(req: NextRequest) {
  try {
    const token = extractTokenFromRequest(req);

    // Fetch products and stats in parallel, handling errors gracefully
    const [productsResult, statsResult] = await Promise.all([
      backendGet('/products', token).catch(err => ({ success: false, error: err.message, data: [] })),
      backendGet('/products/stats/summary', token).catch(err => ({ success: false, error: err.message }))
    ]);

    if (!productsResult.success) {
      console.error("Failed to fetch products:", productsResult);
      return NextResponse.json(productsResult, { status: 500 });
    }

    const products = Array.isArray(productsResult.data) ? productsResult.data : [];

    if (!statsResult.success) {
      console.warn("Failed to fetch product stats, using fallback:", statsResult);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stats = statsResult.success && (statsResult as any).data ? (statsResult as any).data : {
      totalProducts: products.length,
      totalValue: 0, // Fallback if stats fail
      lowStockCount: 0
    };

    return NextResponse.json({
      success: true,
      data: products, // Keep standard structure
      products: products, // For AnalyticsOverview
      stats: stats
    }, {
      status: 200
    });
  } catch (error) {
    console.error("Error fetching products from backend:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/products
 * Create product via backend
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = extractTokenFromRequest(req);
    const result = await backendPost('/products', body, token);

    return NextResponse.json(result, {
      status: result.success ? 201 : 500
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create product" },
      { status: 500 }
    );
  }
}
