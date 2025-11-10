import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdminFromRequest } from '@/lib/auth';

const USERS_PATH = path.join(process.cwd(), 'src', 'data', 'users.json');

export async function GET(req: Request) {
  const check = requireAdminFromRequest(req);
  if (!check.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const raw = fs.readFileSync(USERS_PATH, 'utf-8');
    type User = { id: string; name: string; email: string; isAdmin?: boolean };
    const users = JSON.parse(raw) as Array<User>;
    // hide password
    const out = users.map((u: User) => ({ id: u.id, name: u.name, email: u.email, isAdmin: !!u.isAdmin }));
    return NextResponse.json({ users: out });
  } catch {
    return NextResponse.json({ error: 'read_failed' }, { status: 500 });
  }
}
