import { NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';

export async function GET() {
  try {
    // Fetch from backend (which now returns active banners only)
    const res = await fetch(`${BACKEND_API_URL}/banners`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      }
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
