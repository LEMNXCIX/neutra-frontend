import { NextRequest, NextResponse } from 'next/server';
import { getProxyHeaders } from '@/lib/proxy';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.toString();
    const url = `${BACKEND_URL}/appointments/availability?${query}`;

    try {
        const headers = getProxyHeaders(request);
        console.log(`[Proxy] Fetching availability from ${url}`);

        const response = await fetch(url, {
            method: 'GET',
            headers,
            cache: 'no-store',
        });

        console.log(`[Proxy] Backend response status: ${response.status}`);

        if (!response.ok) {
            const text = await response.text();
            console.error(`[Proxy] Backend error: ${response.status} ${text}`);
            return NextResponse.json(
                { success: false, message: `Backend error: ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        console.error('Error fetching availability:', error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error', error: error.message },
            { status: 500 }
        );
    }
}
