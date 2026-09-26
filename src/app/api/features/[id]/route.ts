import { readJsonResponse } from "@/lib/response";
import { NextRequest, NextResponse } from 'next/server';
import { getProxyHeaders } from '@/lib/proxy';
import { getBackendUrl } from '@/lib/backend-url';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    try {
  const response = await fetch(`${getBackendUrl()}/features/${id}`, {
    headers: getProxyHeaders(request),
    cache: 'no-store',
  });

        const data = await readJsonResponse(response);
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error(`Error fetching feature ${id}:`, error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch feature' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    try {
        const body = await request.json();

  const response = await fetch(`${getBackendUrl()}/features/${id}`, {
    method: 'PUT',
    headers: {
      ...getProxyHeaders(request),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

        const data = await readJsonResponse(response);
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error(`Error updating feature ${id}:`, error);
        return NextResponse.json(
            { success: false, message: 'Failed to update feature' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    try {
  const response = await fetch(`${getBackendUrl()}/features/${id}`, {
    method: 'DELETE',
    headers: getProxyHeaders(request),
    cache: 'no-store',
  });

        // Backend might return 204 No Content
        if (response.status === 204) {
            return new NextResponse(null, { status: 204 });
        }

        const data = await readJsonResponse(response);
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error(`Error deleting feature ${id}:`, error);
        return NextResponse.json(
            { success: false, message: 'Failed to delete feature' },
            { status: 500 }
        );
    }
}
