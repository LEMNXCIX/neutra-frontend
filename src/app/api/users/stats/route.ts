import { NextRequest, NextResponse } from 'next/server';
import { getProxyHeaders } from '@/lib/proxy';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';

export async function GET(request: NextRequest) {
    try {
        const response = await fetch(`${BACKEND_API_URL}/users/stats`, {
            headers: getProxyHeaders(request),
            cache: "no-store",
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Error fetching user stats:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch user stats' },
            { status: 500 }
        );
    }
}
