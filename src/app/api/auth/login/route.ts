import { NextResponse } from 'next/server';
import { createSession } from '@/lib/session';

export async function POST(req: Request) {
  const body = await req.json();
  const { email, password } = body;
  // read users from public file
  const usersRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/data/users.json`);
  const users = await usersRes.json() as { id: string; name: string; email: string; password: string }[];
  const found = users.find((u) => u.email === email && u.password === password);
  if (!found) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

  const sid = createSession(found.id);
  const res = NextResponse.json({ user: { id: found.id, name: found.name, email: found.email } });
  // set demo session cookie (httpOnly) with session id
  res.cookies.set('_neutra_sid', sid, { httpOnly: true, path: '/' });
  return res;
}
