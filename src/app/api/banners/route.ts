import { NextRequest, NextResponse } from 'next/server';
import { getProxyHeaders } from "@/lib/proxy";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';

/**
 * GET /api/banners
 * Fetch active banners for the current tenant
 */
export async function GET(req: NextRequest) {
  try {
    // Fetch from backend (which now returns active banners only)
    const res = await fetch(`${BACKEND_API_URL}/banners`, {
      cache: 'no-store',
      headers: getProxyHeaders(req)
    });

    const data = await res.json();
    // Proxy the backend response directly (StandardResponse format)
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Proxy error fetching banners:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch banners from backend' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/banners
 * Create banner via backend (proxied)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${BACKEND_API_URL}/banners`, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        ...getProxyHeaders(req),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Proxy error creating banner:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create banner in backend' },
      { status: 500 }
    );
  }
}
