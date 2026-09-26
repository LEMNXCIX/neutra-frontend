import { NextRequest, NextResponse } from 'next/server';
import { getProxyHeaders } from "@/lib/proxy";
import { getBackendUrl } from "@/lib/backend-url";

export async function GET(req: NextRequest) {
  try {
    const res = await fetch(`${getBackendUrl()}/slide`, {
      cache: 'no-store',
      headers: getProxyHeaders(req)
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
