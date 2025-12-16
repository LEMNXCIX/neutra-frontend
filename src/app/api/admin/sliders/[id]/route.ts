import { NextRequest, NextResponse } from "next/server";
import { backendPut, backendDelete } from "@/lib/backend-api";
import { extractTokenFromRequest } from "@/lib/server-auth";

/**
 * PUT /api/admin/sliders/[id]
 * Update slider via backend
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const token = extractTokenFromRequest(req);
    const result = await backendPut(`/slide/${id}`, body, token);

    return NextResponse.json(result, {
      status: result.success ? 200 : 500
    });
  } catch (error) {
    console.error("Error updating slider:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update slider" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/sliders/[id]
 * Delete slider via backend
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = extractTokenFromRequest(req);
    const result = await backendDelete(`/slide/${id}`, token);

    // Handle 204 No Content
    if (result.success && !result.data) {
      return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json(result, {
      status: result.success ? 200 : 500
    });
  } catch (error) {
    console.error("Error deleting slider:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete slider" },
      { status: 500 }
    );
  }
}
