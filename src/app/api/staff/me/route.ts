import { NextRequest, NextResponse } from 'next/server';
import { getProxyHeaders } from '@/lib/proxy';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

export async function GET(request: NextRequest) {
    try {
        const response = await fetch(`${BACKEND_URL}/staff/me`, {
            headers: getProxyHeaders(request),
            cache: 'no-store'
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Error fetching current staff profile:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch current staff profile' },
            { status: 500 }
        );
    }
}
