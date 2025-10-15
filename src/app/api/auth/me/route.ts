import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const cookieHeader = req.headers.get('cookie') || '';
  const cookiePairs = cookieHeader.split(';').map(s => s.trim()).filter(Boolean);
  const cookieMap: Record<string, string> = {};
  for (const p of cookiePairs) {
    const [k, ...v] = p.split('=');
    cookieMap[k] = decodeURIComponent(v.join('='));
  }
  const rawSid = cookieMap['_neutra_sid'];
  if (!rawSid) return NextResponse.json({ user: null });

  // resolve session id to user id
  try {
    const { getUserId } = await import('@/lib/session');
    const userId = getUserId(rawSid);
    if (!userId) return NextResponse.json({ user: null });

    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${base}/data/users.json`);
    if (!res.ok) return NextResponse.json({ user: null });
    const users = await res.json() as { id: string; name: string; email: string; password?: string }[];
    const found = users.find((u) => u.id === userId);
    if (!found) return NextResponse.json({ user: null });
    return NextResponse.json({ user: { id: found.id, name: found.name, email: found.email } });
  } catch {
    return NextResponse.json({ user: null });
  }
}
