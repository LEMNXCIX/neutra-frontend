import { NextRequest, NextResponse } from 'next/server';
import { getProxyHeaders } from '@/lib/proxy';
import { getBackendUrl } from '@/lib/backend-url';

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const body = await request.json();

        // The backend route is PUT /api/appointments/:id/cancel
  const response = await fetch(`${getBackendUrl()}/appointments/${id}/cancel`, {
    method: 'PUT',
    headers: {
      ...getProxyHeaders(request),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error from backend:', response.status, errorText);
            return NextResponse.json(
                { success: false, message: 'Failed to cancel appointment' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
