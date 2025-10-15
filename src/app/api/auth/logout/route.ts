import { NextResponse } from 'next/server';
import { invalidateSession } from '@/lib/session';

export async function POST(req: Request) {
  // try to invalidate server session and clear cookie
  const cookieHeader = req.headers.get('cookie') || '';
  const cookiePairs = cookieHeader.split(';').map(s => s.trim()).filter(Boolean);
  let sid: string | undefined;
  for (const p of cookiePairs) {
    const [k, ...v] = p.split('=');
    if (k === '_neutra_sid') sid = decodeURIComponent(v.join('='));
  }
  if (sid) invalidateSession(sid);
  const res = NextResponse.json({ ok: true });
  res.cookies.set('_neutra_sid', '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
