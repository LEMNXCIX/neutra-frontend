import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdminFromRequest } from '@/lib/auth';

const CATEGORIES_PATH = path.join(process.cwd(), 'src', 'data', 'categories.json');

export async function GET(req: Request) {
  const check = requireAdminFromRequest(req);
  if (!check.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const raw = fs.readFileSync(CATEGORIES_PATH, 'utf-8');
    const cats = JSON.parse(raw);
    return NextResponse.json({ categories: cats });
  } catch {
    return NextResponse.json({ categories: [] });
  }
}

export async function POST(req: Request) {
  const check = requireAdminFromRequest(req);
  if (!check.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || !body.name) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  try {
    const raw = fs.readFileSync(CATEGORIES_PATH, 'utf-8');
    const cats = JSON.parse(raw) as Array<any>;
    const id = `c_${Date.now()}`;
    const newC = { id, name: String(body.name), description: body.description ? String(body.description) : undefined };
    cats.push(newC);
    const tmp = `${CATEGORIES_PATH}.tmp`;
    const bak = `${CATEGORIES_PATH}.bak`;
    if (fs.existsSync(CATEGORIES_PATH)) fs.copyFileSync(CATEGORIES_PATH, bak);
    fs.writeFileSync(tmp, JSON.stringify(cats, null, 2), 'utf-8');
    fs.renameSync(tmp, CATEGORIES_PATH);
    return NextResponse.json(newC);
  } catch {
    return NextResponse.json({ error: 'write_failed' }, { status: 500 });
  }
}
