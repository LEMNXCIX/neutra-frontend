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

    const path = await import('path');
    const fs = await import('fs');
    const usersPath = path.join(process.cwd(), 'src', 'data', 'users.json');
    const usersRaw = fs.readFileSync(usersPath, 'utf-8');
    const users = JSON.parse(usersRaw) as { id: string; name: string; email: string; password?: string; isAdmin?: boolean; avatar?: string }[];
    const found = users.find((u) => u.id === userId);
    if (!found) return NextResponse.json({ user: null });
    return NextResponse.json({ user: { id: found.id, name: found.name, email: found.email, isAdmin: !!found.isAdmin, avatar: found.avatar || null } });
  } catch {
    return NextResponse.json({ user: null });
  }
}
