import { NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_API_URL}/slide`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!res.ok) {
      // If the backend returns 404 or 500, we should probably return empty sliders
      // to avoid breaking the frontend.
      console.error(`Failed to fetch sliders from backend: ${res.status} ${res.statusText}`);
      return NextResponse.json({ sliders: [] });
    }

    const data = await res.json();
    // Assuming backend returns StandardResponse format: { success: true, data: [...] }
    const sliders = data.data || [];

    return NextResponse.json({ sliders });
  } catch (error) {
    console.error('Error fetching sliders:', error);
    return NextResponse.json({ sliders: [] });
  }
}
