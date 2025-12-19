import { NextRequest, NextResponse } from "next/server";
import { backendGet, backendPost } from "@/lib/backend-api";
import { extractTokenFromRequest } from "@/lib/server-auth";

/**
 * GET /api/admin/categories
 * Proxy to backend API for categories
 */
export async function GET(req: NextRequest) {
  try {
    const token = extractTokenFromRequest(req);

    // Forward query parameters
    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';

    // Fetch categories and stats in parallel, handling errors gracefully
    const [categoriesResult, statsResult] = await Promise.all([
      backendGet(`/categories${queryString}`, token).catch(err => ({ success: false, error: err.message, data: [] })),
      backendGet('/categories/stats', token).catch(err => ({ success: false, error: err.message }))
    ]);

    if (!categoriesResult.success) {
      return NextResponse.json(categoriesResult, { status: 500 });
    }

    const categories = Array.isArray(categoriesResult.data) ? categoriesResult.data : [];
    const stats = statsResult.success && 'data' in statsResult && statsResult.data
      ? (statsResult as { success: boolean; data: { totalCategories: number; avgProductsPerCategory: number } }).data
      : {
        totalCategories: categories.length,
        avgProductsPerCategory: 0
      };

    return NextResponse.json({
      success: true,
      data: categories,
      stats: stats
    }, {
      status: 200
    });
  } catch (error) {
    console.error("Error fetching categories from backend:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/categories
 * Create category via backend
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = extractTokenFromRequest(req);

    const result = await backendPost('/categories', body, token);

    return NextResponse.json(result, {
      status: result.success ? 201 : 500
    });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create category" },
      { status: 500 }
    );
  }
}
