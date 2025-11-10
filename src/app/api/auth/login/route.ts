import { NextResponse } from 'next/server';
import { createSession } from '@/lib/session';
import { signJwt } from '@/lib/jwt';

export async function POST(req: Request) {
  const body = await req.json();
  const { email, password } = body;
  // read users from public file
  const usersRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/data/users.json`);
  const users = await usersRes.json() as { id: string; name: string; email: string; password: string }[];
  console.log(password)
  console.log(email)
  console.log(users)
  const found = users.find((u) => u.email === email && u.password === password);
  console.log(found)
  if (!found) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

  const sid = createSession(found.id);
  const res = NextResponse.json({ user: { id: found.id, name: found.name, email: found.email } });
  // set demo session cookie (httpOnly) with session id
  res.cookies.set('_neutra_sid', sid, { httpOnly: true, path: '/' });
  // also emit an httpOnly JWT token for optional API usage
  try {
    const token = signJwt({ sub: found.id, email: found.email }, { expiresIn: 60 * 60 * 24 });
    res.cookies.set('neutra_jwt', token, { httpOnly: true, path: '/' });
  } catch {}
  return res;
}
