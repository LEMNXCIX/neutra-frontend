import { NextRequest, NextResponse } from "next/server";
import { backendPut, backendDelete } from "@/lib/backend-api";
import { extractTokenFromRequest } from "@/lib/server-auth";

/**
 * PUT /api/admin/categories/[id]
 * Update category via backend
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<any> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const token = extractTokenFromRequest(req);
    const result = await backendPut(`/categories/${id}`, body, token);

    return NextResponse.json(result, {
      status: result.success ? 200 : 500
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update category" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/categories/[id]
 * Delete category via backend
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<any> }
) {
  try {
    const { id } = await params;
    const token = extractTokenFromRequest(req);
    const result = await backendDelete(`/categories/${id}`, token);

    // Handle 204 No Content (success with no body)
    if (result.success && !result.data) {
      return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json(result, {
      status: result.success ? 200 : 500
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
