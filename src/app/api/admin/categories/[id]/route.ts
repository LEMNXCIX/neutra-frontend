/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdminFromRequest } from '@/lib/auth';

const CATEGORIES_PATH = path.join(process.cwd(), 'src', 'data', 'categories.json');

export async function PUT(req: any, context: any) {
  const check = requireAdminFromRequest(req);
  if (!check.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const id = context.params?.id;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  try {
    const raw = fs.readFileSync(CATEGORIES_PATH, 'utf-8');
    const cats = JSON.parse(raw) as Array<any>;
    const idx = cats.findIndex(c => c.id === id);
    if (idx === -1) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    cats[idx] = { ...cats[idx], ...body };
    const tmp = `${CATEGORIES_PATH}.tmp`;
    const bak = `${CATEGORIES_PATH}.bak`;
    if (fs.existsSync(CATEGORIES_PATH)) fs.copyFileSync(CATEGORIES_PATH, bak);
    fs.writeFileSync(tmp, JSON.stringify(cats, null, 2), 'utf-8');
    fs.renameSync(tmp, CATEGORIES_PATH);
    return NextResponse.json(cats[idx]);
  } catch {
    return NextResponse.json({ error: 'write_failed' }, { status: 500 });
  }
}

export async function DELETE(req: any, context: any) {
  const check = requireAdminFromRequest(req);
  if (!check.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const id = context.params?.id;
  try {
    const raw = fs.readFileSync(CATEGORIES_PATH, 'utf-8');
    let cats = JSON.parse(raw) as Array<any>;
    cats = cats.filter(c => c.id !== id);
    const tmp = `${CATEGORIES_PATH}.tmp`;
    const bak = `${CATEGORIES_PATH}.bak`;
    if (fs.existsSync(CATEGORIES_PATH)) fs.copyFileSync(CATEGORIES_PATH, bak);
    fs.writeFileSync(tmp, JSON.stringify(cats, null, 2), 'utf-8');
    fs.renameSync(tmp, CATEGORIES_PATH);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'write_failed' }, { status: 500 });
  }
}
