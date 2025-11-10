import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdminFromRequest } from '@/lib/auth';

const USERS_PATH = path.join(process.cwd(), 'src', 'data', 'users.json');

export async function POST(req: Request) {
  const check = requireAdminFromRequest(req);
  if (!check.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || !body.userId) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const { userId } = body as { userId: string };

  try {
    const raw = fs.readFileSync(USERS_PATH, 'utf-8');
    type User = { id: string; name: string; email: string; password?: string; isAdmin?: boolean };
    const users = JSON.parse(raw) as Array<User>;
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    users[idx].isAdmin = !users[idx].isAdmin;
    // atomic write: write to temp file then rename; keep a small backup
    const tmpPath = `${USERS_PATH}.tmp`;
    const bakPath = `${USERS_PATH}.bak`;
    try {
      // create backup
      if (fs.existsSync(USERS_PATH)) {
        fs.copyFileSync(USERS_PATH, bakPath);
      }
      fs.writeFileSync(tmpPath, JSON.stringify(users, null, 2), 'utf-8');
      fs.renameSync(tmpPath, USERS_PATH);
    } catch {
      // attempt to restore from backup if possible
      try {
        if (fs.existsSync(bakPath)) fs.copyFileSync(bakPath, USERS_PATH);
      } catch {}
      return NextResponse.json({ error: 'write_failed' }, { status: 500 });
    }
    const out = { id: users[idx].id, name: users[idx].name, email: users[idx].email, isAdmin: !!users[idx].isAdmin };
    return NextResponse.json({ user: out });
  } catch {
    return NextResponse.json({ error: 'write_failed' }, { status: 500 });
  }
}
