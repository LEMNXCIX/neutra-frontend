import { NextRequest, NextResponse } from 'next/server';
import { getProxyHeaders } from '@/lib/proxy';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const response = await fetch(`${BACKEND_URL}/features/${params.id}`, {
            headers: getProxyHeaders(request),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error(`Error fetching feature ${params.id}:`, error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch feature' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();

        const response = await fetch(`${BACKEND_URL}/features/${params.id}`, {
            method: 'PUT',
            headers: {
                ...getProxyHeaders(request),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error(`Error updating feature ${params.id}:`, error);
        return NextResponse.json(
            { success: false, message: 'Failed to update feature' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const response = await fetch(`${BACKEND_URL}/features/${params.id}`, {
            method: 'DELETE',
            headers: getProxyHeaders(request),
        });

        // Backend might return 204 No Content
        if (response.status === 204) {
            return new NextResponse(null, { status: 204 });
        }

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error(`Error deleting feature ${params.id}:`, error);
        return NextResponse.json(
            { success: false, message: 'Failed to delete feature' },
            { status: 500 }
        );
    }
}
