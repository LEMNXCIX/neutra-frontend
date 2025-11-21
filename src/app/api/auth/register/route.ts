import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createSession } from '@/lib/session';
import { signJwt } from '@/lib/jwt';

const USERS_PATH = path.join(process.cwd(), 'src', 'data', 'users.json');

function readUsers() {
  try {
    const raw = fs.readFileSync(USERS_PATH, 'utf-8');
    return JSON.parse(raw) as Array<{ id: string; name: string; email: string; password?: string }>;
  } catch {
    return [];
  }
}

function writeUsers(users: Array<{ id: string; name: string; email: string; password?: string }>) {
  fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2), 'utf-8');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body?.name || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '').trim();

    if (!name || !email || !password) return NextResponse.json({ error: 'invalid' }, { status: 400 });

    const users = readUsers();
    if (users.find(u => u.email === email)) return NextResponse.json({ error: 'email_taken' }, { status: 409 });

    const id = `u_${Date.now()}`;
    const newUser = { id, name, email, password };
    users.push(newUser);
    writeUsers(users);

    // create session and set cookie
    const sid = createSession(id);
    const res = NextResponse.json({ user: { id, name, email, isAdmin: false, avatar: null } });
    res.cookies.set('_neutra_sid', sid, { httpOnly: true, path: '/' });
    try {
      const token = signJwt({ sub: id, email }, { expiresIn: 60 * 60 * 24 });
      res.cookies.set('neutra_jwt', token, { httpOnly: true, path: '/' });
    } catch { }
    return res;
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
