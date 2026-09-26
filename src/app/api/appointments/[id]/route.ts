import { readJsonResponse } from "@/lib/response";
import { NextRequest, NextResponse } from 'next/server';
import { getProxyHeaders } from '@/lib/proxy';
import { getBackendUrl } from '@/lib/backend-url';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const backendUrl = getBackendUrl();

    try {
        const headers = await getProxyHeaders(request);
		const response = await fetch(`${backendUrl}/appointments/${id}`, {
			headers,
			cache: 'no-store',
		});

        const data = await readJsonResponse(response);
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        console.error('Error fetching appointment detail:', error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const backendUrl = getBackendUrl();

    try {
        const headers = await getProxyHeaders(request);
		const response = await fetch(`${backendUrl}/appointments/${id}`, {
			method: 'DELETE',
			headers,
			cache: 'no-store',
		});

        const data = await readJsonResponse(response);
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        console.error('Error deleting appointment:', error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
