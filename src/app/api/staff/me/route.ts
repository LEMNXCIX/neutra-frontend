import { readJsonResponse } from "@/lib/response";
import { NextRequest, NextResponse } from 'next/server';
import { getProxyHeaders } from '@/lib/proxy';
import { getBackendUrl } from '@/lib/backend-url';

export async function GET(request: NextRequest) {
    try {
        const response = await fetch(`${getBackendUrl()}/staff/me`, {
            headers: getProxyHeaders(request),
            cache: 'no-store'
        });

        const data = await readJsonResponse(response);
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Error fetching current staff profile:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch current staff profile' },
            { status: 500 }
        );
    }
}
